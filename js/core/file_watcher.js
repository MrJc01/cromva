/**
 * Cromva File Watcher
 * Monitora mudanças externas em arquivos
 */

const FileWatcher = {
    // Arquivos sendo monitorados
    watchedFiles: new Map(),

    // Intervalo de polling
    pollInterval: 3000,
    pollTimer: null,

    // Callbacks
    onChangeCallbacks: [],

    /**
     * Inicia monitoramento de arquivo
     */
    watch(handle, callback) {
        const key = handle.name;

        // Obter estado inicial
        this._getFileState(handle).then(state => {
            this.watchedFiles.set(key, {
                handle,
                lastState: state,
                callback
            });

            console.log('[FileWatcher] Watching:', key);
        });

        // Iniciar polling se não estiver rodando
        if (!this.pollTimer) {
            this._startPolling();
        }
    },

    /**
     * Para monitoramento de arquivo
     */
    unwatch(handle) {
        const key = handle.name;
        this.watchedFiles.delete(key);
        console.log('[FileWatcher] Unwatched:', key);

        // Parar polling se não há mais arquivos
        if (this.watchedFiles.size === 0 && this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    },

    /**
     * Adiciona callback global de mudança
     */
    onChange(callback) {
        this.onChangeCallbacks.push(callback);
    },

    /**
     * Remove callback global
     */
    offChange(callback) {
        const index = this.onChangeCallbacks.indexOf(callback);
        if (index !== -1) {
            this.onChangeCallbacks.splice(index, 1);
        }
    },

    /**
     * Inicia polling
     */
    _startPolling() {
        this.pollTimer = setInterval(() => {
            this._checkAllFiles();
        }, this.pollInterval);
    },

    /**
     * Verifica todos os arquivos
     */
    async _checkAllFiles() {
        for (const [key, data] of this.watchedFiles) {
            try {
                const currentState = await this._getFileState(data.handle);

                if (this._hasChanged(data.lastState, currentState)) {
                    console.log('[FileWatcher] Change detected:', key);

                    // Atualizar estado
                    data.lastState = currentState;

                    // Chamar callback específico
                    if (data.callback) {
                        data.callback({
                            file: key,
                            handle: data.handle,
                            oldState: data.lastState,
                            newState: currentState
                        });
                    }

                    // Chamar callbacks globais
                    for (const cb of this.onChangeCallbacks) {
                        cb({
                            file: key,
                            handle: data.handle,
                            state: currentState
                        });
                    }

                    // Emitir evento
                    if (typeof CromvaEvents !== 'undefined') {
                        CromvaEvents.emit('file:external-change', {
                            file: key,
                            handle: data.handle
                        });
                    }
                }
            } catch (e) {
                console.warn('[FileWatcher] Check failed for:', key, e.message);
            }
        }
    },

    /**
     * Obtém estado do arquivo
     */
    async _getFileState(handle) {
        try {
            const file = await handle.getFile();
            return {
                size: file.size,
                lastModified: file.lastModified,
                name: file.name
            };
        } catch (e) {
            return null;
        }
    },

    /**
     * Verifica se houve mudança
     */
    _hasChanged(oldState, newState) {
        if (!oldState || !newState) return false;

        return oldState.size !== newState.size ||
            oldState.lastModified !== newState.lastModified;
    },

    /**
     * Define intervalo de polling
     */
    setPollingInterval(ms) {
        this.pollInterval = ms;

        // Reiniciar timer
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this._startPolling();
        }
    },

    /**
     * Para todos os watchers
     */
    stopAll() {
        this.watchedFiles.clear();

        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }

        console.log('[FileWatcher] Stopped all watchers');
    },

    /**
     * Retorna arquivos monitorados
     */
    getWatched() {
        return Array.from(this.watchedFiles.keys());
    }
};

// Export global
window.FileWatcher = FileWatcher;
