/**
 * Cromva Logger
 * Sistema de logging centralizado
 */

const CromvaLogger = {
    // Níveis de log
    LEVELS: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        NONE: 4
    },

    // Configuração atual
    level: 1, // INFO

    // Histórico de logs
    history: [],
    maxHistory: 200,

    // Callbacks
    onLog: null,

    /**
     * Configura nível mínimo
     */
    setLevel(level) {
        if (typeof level === 'string') {
            level = this.LEVELS[level.toUpperCase()] || 1;
        }
        this.level = level;
    },

    /**
     * Log debug
     */
    debug(module, ...args) {
        this._log('DEBUG', module, args);
    },

    /**
     * Log info
     */
    info(module, ...args) {
        this._log('INFO', module, args);
    },

    /**
     * Log warning
     */
    warn(module, ...args) {
        this._log('WARN', module, args);
    },

    /**
     * Log error
     */
    error(module, ...args) {
        this._log('ERROR', module, args);
    },

    /**
     * Log interno
     */
    _log(levelName, module, args) {
        const levelValue = this.LEVELS[levelName];

        // Verifica nível mínimo
        if (levelValue < this.level) return;

        const entry = {
            timestamp: new Date().toISOString(),
            level: levelName,
            module,
            message: args.map(a =>
                typeof a === 'object' ? JSON.stringify(a) : String(a)
            ).join(' ')
        };

        // Adicionar ao histórico
        this.history.push(entry);
        while (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        // Output no console
        const prefix = `[${module}]`;
        const consoleArgs = [prefix, ...args];

        switch (levelName) {
            case 'DEBUG':
                console.debug(...consoleArgs);
                break;
            case 'INFO':
                console.log(...consoleArgs);
                break;
            case 'WARN':
                console.warn(...consoleArgs);
                break;
            case 'ERROR':
                console.error(...consoleArgs);
                break;
        }

        // Callback
        if (this.onLog) {
            this.onLog(entry);
        }
    },

    /**
     * Retorna logs filtrados
     */
    getHistory(options = {}) {
        let logs = [...this.history];

        if (options.level) {
            const minLevel = this.LEVELS[options.level] || 0;
            logs = logs.filter(l => this.LEVELS[l.level] >= minLevel);
        }

        if (options.module) {
            logs = logs.filter(l => l.module === options.module);
        }

        if (options.limit) {
            logs = logs.slice(-options.limit);
        }

        return logs;
    },

    /**
     * Exporta logs
     */
    export() {
        return JSON.stringify({
            exportedAt: new Date().toISOString(),
            logs: this.history
        }, null, 2);
    },

    /**
     * Limpa histórico
     */
    clear() {
        this.history = [];
    },

    /**
     * Cria logger com namespace
     */
    createLogger(module) {
        return {
            debug: (...args) => this.debug(module, ...args),
            info: (...args) => this.info(module, ...args),
            warn: (...args) => this.warn(module, ...args),
            error: (...args) => this.error(module, ...args)
        };
    }
};

// Export global
window.CromvaLogger = CromvaLogger;
