/**
 * Cromva Error Handler
 * Error boundaries, tela de erro amigável, health check
 */

const ErrorHandler = {
    // Erros capturados
    errors: [],

    // Estado de saúde
    healthStatus: {
        lastCheck: null,
        isHealthy: true,
        components: {}
    },

    /**
     * Inicializa error handler
     */
    init() {
        // Capturar erros não tratados
        window.onerror = (msg, url, line, col, error) => {
            this.capture(error || new Error(msg), {
                url, line, col, type: 'uncaught'
            });
            return false;
        };

        // Capturar rejeições de promises
        window.onunhandledrejection = (event) => {
            this.capture(event.reason || new Error('Promise rejected'), {
                type: 'unhandled-rejection'
            });
        };

        // Health check inicial
        this.healthCheck();

        console.log('[ErrorHandler] Initialized');
    },

    /**
     * Captura erro
     */
    capture(error, context = {}) {
        const entry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            message: error.message || String(error),
            stack: error.stack,
            name: error.name,
            context,
            url: window.location.href
        };

        this.errors.push(entry);

        // Manter últimos 50 erros
        while (this.errors.length > 50) {
            this.errors.shift();
        }

        console.error('[ErrorHandler] Captured:', entry.message);

        // Mostrar erro se for crítico
        if (context.type === 'uncaught' || context.critical) {
            this.showErrorScreen(entry);
        }

        // Emitir evento
        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('error:captured', entry);
        }

        return entry;
    },

    /**
     * Wrap função com try/catch
     */
    wrap(fn, context = {}) {
        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                this.capture(error, { ...context, args });
                throw error;
            }
        };
    },

    /**
     * Executa com error boundary
     */
    async boundary(fn, fallback = null) {
        try {
            return await fn();
        } catch (error) {
            this.capture(error, { type: 'boundary' });
            return fallback;
        }
    },

    /**
     * Mostra tela de erro amigável
     */
    showErrorScreen(error) {
        // Remover tela anterior se existir
        const existing = document.getElementById('cromva-error-screen');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'cromva-error-screen';
        overlay.className = 'fixed inset-0 z-[9999] bg-zinc-900 flex items-center justify-center p-4';

        overlay.innerHTML = `
            <div class="max-w-lg w-full bg-zinc-800 border border-red-600/50 rounded-2xl p-8 text-center">
                <div class="text-6xl mb-4">⚠️</div>
                <h1 class="text-2xl font-bold text-white mb-2">Algo deu errado</h1>
                <p class="text-zinc-400 mb-6">Ocorreu um erro inesperado. Tente recarregar a página.</p>
                
                <details class="text-left mb-6 p-4 bg-zinc-900 rounded-lg">
                    <summary class="text-sm text-zinc-500 cursor-pointer">Detalhes técnicos</summary>
                    <pre class="mt-2 text-xs text-red-400 overflow-auto max-h-40">${this._escapeHtml(error.message)}\n${this._escapeHtml(error.stack || '')}</pre>
                </details>

                <div class="flex gap-3 justify-center">
                    <button onclick="location.reload()" class="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition">
                        🔄 Recarregar
                    </button>
                    <button onclick="ErrorHandler.dismiss()" class="px-6 py-3 bg-zinc-700 text-zinc-300 rounded-lg font-medium hover:bg-zinc-600 transition">
                        Continuar
                    </button>
                </div>

                <p class="mt-6 text-xs text-zinc-500">
                    Se o problema persistir, exporte os logs de erro e entre em contato.
                </p>
                <button onclick="ErrorHandler.exportErrors()" class="mt-2 text-xs text-blue-400 hover:underline">
                    Exportar logs
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
    },

    /**
     * Fecha tela de erro
     */
    dismiss() {
        const overlay = document.getElementById('cromva-error-screen');
        if (overlay) overlay.remove();
    },

    /**
     * Health check
     */
    async healthCheck() {
        const checks = {
            localStorage: await this._checkLocalStorage(),
            indexedDB: await this._checkIndexedDB(),
            fileSystem: await this._checkFileSystem(),
            memory: this._checkMemory()
        };

        this.healthStatus = {
            lastCheck: new Date().toISOString(),
            isHealthy: Object.values(checks).every(c => c.healthy),
            components: checks
        };

        console.log('[ErrorHandler] Health check:', this.healthStatus.isHealthy ? 'OK' : 'ISSUES FOUND');
        return this.healthStatus;
    },

    /**
     * Verifica localStorage
     */
    async _checkLocalStorage() {
        try {
            const testKey = '__health_check__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return { healthy: true, message: 'OK' };
        } catch (e) {
            return { healthy: false, message: e.message };
        }
    },

    /**
     * Verifica IndexedDB
     */
    async _checkIndexedDB() {
        try {
            if (!window.indexedDB) {
                return { healthy: false, message: 'Not supported' };
            }
            return { healthy: true, message: 'OK' };
        } catch (e) {
            return { healthy: false, message: e.message };
        }
    },

    /**
     * Verifica File System API
     */
    async _checkFileSystem() {
        try {
            if (!('showDirectoryPicker' in window)) {
                return { healthy: false, message: 'Not supported' };
            }
            return { healthy: true, message: 'OK' };
        } catch (e) {
            return { healthy: false, message: e.message };
        }
    },

    /**
     * Verifica memória
     */
    _checkMemory() {
        try {
            if ('memory' in performance) {
                const mem = performance.memory;
                const usedPercent = (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100;
                return {
                    healthy: usedPercent < 90,
                    message: `${usedPercent.toFixed(1)}% used`
                };
            }
            return { healthy: true, message: 'Not available' };
        } catch (e) {
            return { healthy: true, message: 'Not available' };
        }
    },

    /**
     * Retorna erros recentes
     */
    getErrors(limit = 10) {
        return this.errors.slice(-limit);
    },

    /**
     * Exporta erros
     */
    exportErrors() {
        const data = JSON.stringify({
            exportedAt: new Date().toISOString(),
            health: this.healthStatus,
            errors: this.errors
        }, null, 2);

        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `cromva-errors-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    },

    /**
     * Limpa erros
     */
    clear() {
        this.errors = [];
        console.log('[ErrorHandler] Errors cleared');
    },

    /**
     * Escape HTML
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ErrorHandler.init());
} else {
    ErrorHandler.init();
}

// Export global
window.ErrorHandler = ErrorHandler;
