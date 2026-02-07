/**
 * Cromva Offline Mode
 * Suporte a modo offline com Service Worker
 */

const OfflineMode = {
    isEnabled: false,
    pendingSync: [],
    STORAGE_KEY: 'cromva-pending-sync',

    /**
     * Inicializa modo offline
     */
    async init() {
        // Carregar ações pendentes
        this.loadPendingSync();

        // Verificar suporte a Service Worker
        if ('serviceWorker' in navigator) {
            try {
                // Registrar service worker (se existir)
                // await navigator.serviceWorker.register('/sw.js');
                this.isEnabled = true;
                console.log('[OfflineMode] Service Worker support available');
            } catch (e) {
                console.warn('[OfflineMode] Service Worker registration failed:', e);
            }
        }

        // Listener para quando voltar online
        window.addEventListener('online', () => this.syncPending());

        console.log('[OfflineMode] Initialized');
    },

    /**
     * Carrega ações pendentes do localStorage
     */
    loadPendingSync() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                this.pendingSync = JSON.parse(saved);
            }
        } catch (e) {
            console.error('[OfflineMode] Error loading pending:', e);
        }
    },

    /**
     * Salva ações pendentes
     */
    savePendingSync() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.pendingSync));
        } catch (e) {
            console.error('[OfflineMode] Error saving pending:', e);
        }
    },

    /**
     * Adiciona ação para sincronização posterior
     */
    queueAction(action) {
        this.pendingSync.push({
            ...action,
            timestamp: Date.now(),
            id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });

        this.savePendingSync();
        this.updateBadge();

        console.log('[OfflineMode] Queued action:', action.type);
    },

    /**
     * Sincroniza ações pendentes quando online
     */
    async syncPending() {
        if (!navigator.onLine || this.pendingSync.length === 0) {
            return;
        }

        console.log('[OfflineMode] Syncing', this.pendingSync.length, 'actions...');
        showToast('Sincronizando alterações...');

        const actions = [...this.pendingSync];
        let synced = 0;

        for (const action of actions) {
            try {
                await this.executeAction(action);

                // Remover da fila
                this.pendingSync = this.pendingSync.filter(a => a.id !== action.id);
                synced++;
            } catch (e) {
                console.error('[OfflineMode] Sync failed for:', action, e);
            }
        }

        this.savePendingSync();
        this.updateBadge();

        if (synced > 0) {
            showToast(`${synced} alteração(ões) sincronizada(s) ✓`);
        }
    },

    /**
     * Executa uma ação
     */
    async executeAction(action) {
        switch (action.type) {
            case 'save-note':
                // Re-salvar nota
                if (typeof saveData === 'function') {
                    saveData();
                }
                break;

            case 'save-file':
                // Re-salvar arquivo local
                if (typeof FSHandler !== 'undefined' && action.data) {
                    await FSHandler.saveFile(action.data.workspaceId, action.data.filename, action.data.content);
                }
                break;

            default:
                console.warn('[OfflineMode] Unknown action type:', action.type);
        }
    },

    /**
     * Atualiza badge de pendentes
     */
    updateBadge() {
        let badge = document.getElementById('offline-badge');

        if (this.pendingSync.length === 0) {
            if (badge) badge.remove();
            return;
        }

        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'offline-badge';
            badge.className = 'fixed bottom-4 left-4 z-[60] flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium bg-orange-900/50 border border-orange-700/50 text-orange-400';
            document.body.appendChild(badge);
        }

        badge.innerHTML = `
            <span class="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            ${this.pendingSync.length} pendente(s)
        `;
    },

    /**
     * Verifica se está offline
     */
    isOffline() {
        return !navigator.onLine;
    },

    /**
     * Limpa ações pendentes
     */
    clearPending() {
        this.pendingSync = [];
        this.savePendingSync();
        this.updateBadge();
    },

    /**
     * Retorna status
     */
    getStatus() {
        return {
            online: navigator.onLine,
            enabled: this.isEnabled,
            pending: this.pendingSync.length
        };
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => OfflineMode.init());
} else {
    OfflineMode.init();
}

// Export global
window.OfflineMode = OfflineMode;
