/**
 * Cromva Storage Info
 * Indicador de espaço disponível
 */

const StorageInfo = {
    element: null,

    /**
     * Inicializa o componente
     */
    init() {
        console.log('[StorageInfo] Initialized');
    },

    /**
     * Calcula uso de armazenamento
     */
    async getUsage() {
        const usage = {
            localStorage: 0,
            indexedDB: 0,
            quota: null,
            used: null,
            available: null
        };

        // LocalStorage
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                usage.localStorage += localStorage[key].length * 2; // UTF-16
            }
        }

        // Storage API (se disponível)
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                usage.quota = estimate.quota;
                usage.used = estimate.usage;
                usage.available = estimate.quota - estimate.usage;
            } catch (e) {
                console.warn('[StorageInfo] Storage estimate failed:', e);
            }
        }

        return usage;
    },

    /**
     * Formata bytes
     */
    formatBytes(bytes) {
        if (bytes === null || bytes === undefined) return 'N/A';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        return (bytes / 1073741824).toFixed(2) + ' GB';
    },

    /**
     * Calcula porcentagem
     */
    getPercentage(used, total) {
        if (!used || !total) return 0;
        return Math.round((used / total) * 100);
    },

    /**
     * Renderiza indicador
     */
    async render(containerId) {
        const container = typeof containerId === 'string'
            ? document.getElementById(containerId)
            : containerId;

        if (!container) return;

        const usage = await this.getUsage();
        const percentage = this.getPercentage(usage.used, usage.quota);

        // Cor baseada no uso
        let color = 'emerald';
        if (percentage > 80) color = 'red';
        else if (percentage > 60) color = 'orange';
        else if (percentage > 40) color = 'yellow';

        container.innerHTML = `
            <div class="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-medium text-zinc-300">💾 Armazenamento</span>
                    <span class="text-xs text-zinc-500">${percentage}%</span>
                </div>
                
                <div class="w-full h-2 bg-zinc-700 rounded-full overflow-hidden mb-3">
                    <div class="h-full bg-${color}-500 transition-all duration-500" 
                         style="width: ${percentage}%"></div>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="text-zinc-500">Usado:</div>
                    <div class="text-zinc-300 text-right">${this.formatBytes(usage.used)}</div>
                    
                    <div class="text-zinc-500">Disponível:</div>
                    <div class="text-zinc-300 text-right">${this.formatBytes(usage.available)}</div>
                    
                    <div class="text-zinc-500">Total:</div>
                    <div class="text-zinc-300 text-right">${this.formatBytes(usage.quota)}</div>
                </div>

                <div class="mt-3 pt-3 border-t border-zinc-700">
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="text-zinc-500">LocalStorage:</div>
                        <div class="text-zinc-300 text-right">${this.formatBytes(usage.localStorage)}</div>
                    </div>
                </div>
            </div>
        `;

        this.element = container;
    },

    /**
     * Renderiza badge compacto
     */
    async renderBadge(containerId) {
        const container = typeof containerId === 'string'
            ? document.getElementById(containerId)
            : containerId;

        if (!container) return;

        const usage = await this.getUsage();
        const percentage = this.getPercentage(usage.used, usage.quota);

        let color = 'emerald';
        if (percentage > 80) color = 'red';
        else if (percentage > 60) color = 'orange';

        container.innerHTML = `
            <div class="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 border border-zinc-700 rounded-full text-xs">
                <div class="w-8 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                    <div class="h-full bg-${color}-500" style="width: ${percentage}%"></div>
                </div>
                <span class="text-zinc-400">${this.formatBytes(usage.available)} livre</span>
            </div>
        `;
    },

    /**
     * Verifica se está com pouco espaço
     */
    async checkLowSpace(threshold = 0.9) {
        const usage = await this.getUsage();
        if (!usage.quota) return false;

        const percentage = usage.used / usage.quota;

        if (percentage > threshold) {
            showToast('⚠️ Espaço está quase cheio!');
            return true;
        }

        return false;
    },

    /**
     * Limpa dados antigos
     */
    async cleanup() {
        // Limpar cache de handles antigos
        if (typeof HandleStore !== 'undefined') {
            // HandleStore não tem método de limpeza ainda
        }

        // Limpar offline sync antigo
        if (typeof OfflineMode !== 'undefined') {
            OfflineMode.clearPending();
        }

        showToast('Dados antigos limpos');
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => StorageInfo.init());
} else {
    StorageInfo.init();
}

// Export global
window.StorageInfo = StorageInfo;
