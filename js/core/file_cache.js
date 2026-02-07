/**
 * Cromva File Cache
 * Cache de arquivos lidos + Fila de escrita + Retry logic
 */

const FileCache = {
    // Cache de arquivos lidos
    cache: new Map(),

    // Fila de operações de escrita
    writeQueue: [],
    isProcessing: false,

    // Configurações
    config: {
        maxCacheSize: 50,
        maxCacheAge: 5 * 60 * 1000, // 5 minutos
        maxRetries: 3,
        retryDelay: 1000
    },

    // Log de operações
    operationLog: [],

    /**
     * Lê arquivo com cache
     */
    async read(handle, options = {}) {
        const cacheKey = handle.name;
        const forceRefresh = options.forceRefresh || false;

        // Verificar cache
        if (!forceRefresh && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);

            // Verificar se ainda é válido
            if (Date.now() - cached.timestamp < this.config.maxCacheAge) {
                this._log('read', handle.name, 'cache-hit');
                return cached.content;
            }
        }

        // Ler do sistema de arquivos
        try {
            const file = await handle.getFile();
            const content = await file.text();

            // Adicionar ao cache
            this._addToCache(cacheKey, content);
            this._log('read', handle.name, 'success');

            return content;
        } catch (e) {
            this._log('read', handle.name, 'error', e.message);
            throw e;
        }
    },

    /**
     * Escreve arquivo com fila e retry
     */
    async write(handle, content, options = {}) {
        const priority = options.priority || 'normal';
        const immediate = options.immediate || false;

        const operation = {
            id: Date.now(),
            handle,
            content,
            priority,
            retries: 0,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        if (immediate) {
            return await this._executeWrite(operation);
        }

        // Adicionar à fila
        if (priority === 'high') {
            this.writeQueue.unshift(operation);
        } else {
            this.writeQueue.push(operation);
        }

        this._log('write', handle.name, 'queued');

        // Processar fila
        this._processQueue();

        return operation.id;
    },

    /**
     * Processa fila de escrita
     */
    async _processQueue() {
        if (this.isProcessing || this.writeQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.writeQueue.length > 0) {
            const operation = this.writeQueue.shift();
            await this._executeWrite(operation);
        }

        this.isProcessing = false;
    },

    /**
     * Executa operação de escrita com retry
     */
    async _executeWrite(operation) {
        while (operation.retries < this.config.maxRetries) {
            try {
                // Criar backup antes de sobrescrever
                await this._createFileBackup(operation.handle);

                // Escrever arquivo
                const writable = await operation.handle.createWritable();
                await writable.write(operation.content);
                await writable.close();

                // Atualizar cache
                this._addToCache(operation.handle.name, operation.content);

                operation.status = 'success';
                this._log('write', operation.handle.name, 'success');

                return true;
            } catch (e) {
                operation.retries++;
                operation.lastError = e.message;

                this._log('write', operation.handle.name, 'retry', `Attempt ${operation.retries}`);

                if (operation.retries < this.config.maxRetries) {
                    await this._sleep(this.config.retryDelay * operation.retries);
                }
            }
        }

        operation.status = 'failed';
        this._log('write', operation.handle.name, 'failed', operation.lastError);

        throw new Error(`Write failed after ${this.config.maxRetries} retries: ${operation.lastError}`);
    },

    /**
     * Cria backup do arquivo antes de sobrescrever
     */
    async _createFileBackup(handle) {
        try {
            const file = await handle.getFile();
            const content = await file.text();

            // Salvar no localStorage como backup temporário
            const backupKey = `file_backup_${handle.name}_${Date.now()}`;
            localStorage.setItem(backupKey, content);

            // Limpar backups antigos (manter apenas últimos 3)
            this._cleanOldBackups(handle.name);
        } catch (e) {
            // Arquivo pode não existir ainda
            console.warn('[FileCache] Backup failed (file may be new):', e.message);
        }
    },

    /**
     * Limpa backups antigos
     */
    _cleanOldBackups(filename) {
        const prefix = `file_backup_${filename}_`;
        const backups = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(prefix)) {
                backups.push(key);
            }
        }

        // Ordenar por timestamp (mais antigo primeiro)
        backups.sort();

        // Remover mais antigos, manter 3
        while (backups.length > 3) {
            localStorage.removeItem(backups.shift());
        }
    },

    /**
     * Adiciona item ao cache
     */
    _addToCache(key, content) {
        // Limpar cache se cheio
        if (this.cache.size >= this.config.maxCacheSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            content,
            timestamp: Date.now()
        });
    },

    /**
     * Invalida cache para arquivo
     */
    invalidate(filename) {
        this.cache.delete(filename);
        this._log('cache', filename, 'invalidated');
    },

    /**
     * Limpa todo o cache
     */
    clearCache() {
        this.cache.clear();
        this._log('cache', 'all', 'cleared');
    },

    /**
     * Registra operação no log
     */
    _log(type, filename, status, details = null) {
        const entry = {
            timestamp: new Date().toISOString(),
            type,
            filename,
            status,
            details
        };

        this.operationLog.push(entry);

        // Manter apenas últimas 100 entradas
        while (this.operationLog.length > 100) {
            this.operationLog.shift();
        }
    },

    /**
     * Retorna log de operações
     */
    getLog(limit = 20) {
        return this.operationLog.slice(-limit);
    },

    /**
     * Exporta log
     */
    exportLog() {
        return JSON.stringify(this.operationLog, null, 2);
    },

    /**
     * Sleep helper
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Retorna estatísticas
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            queueLength: this.writeQueue.length,
            logEntries: this.operationLog.length,
            isProcessing: this.isProcessing
        };
    }
};

// Export global
window.FileCache = FileCache;
