/**
 * Cromva Connection Status
 * Indicador de conexão e modo offline
 */

const ConnectionStatus = {
    isOnline: navigator.onLine,
    statusElement: null,

    /**
     * Inicializa o monitoramento de conexão
     */
    init() {
        this.createIndicator();

        // Event listeners
        window.addEventListener('online', () => this.setOnline(true));
        window.addEventListener('offline', () => this.setOnline(false));

        // Status inicial
        this.updateIndicator();

        console.log('[ConnectionStatus] Initialized, online:', this.isOnline);
    },

    /**
     * Cria indicador visual
     */
    createIndicator() {
        if (document.getElementById('connection-status')) return;

        const indicator = document.createElement('div');
        indicator.id = 'connection-status';
        indicator.className = 'fixed bottom-4 right-4 z-[60] flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all duration-300';
        indicator.style.opacity = '0';

        document.body.appendChild(indicator);
        this.statusElement = indicator;
    },

    /**
     * Atualiza estado online/offline
     */
    setOnline(isOnline) {
        const wasOffline = !this.isOnline;
        this.isOnline = isOnline;

        this.updateIndicator();

        // Notificar mudança
        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('connection:changed', { online: isOnline });
        }

        // Toast apenas quando muda estado
        if (isOnline && wasOffline) {
            showToast('Conexão restaurada ✓');
        } else if (!isOnline) {
            showToast('Você está offline');
        }

        console.log('[ConnectionStatus] Online:', isOnline);
    },

    /**
     * Atualiza indicador visual
     */
    updateIndicator() {
        if (!this.statusElement) return;

        if (this.isOnline) {
            this.statusElement.innerHTML = `
                <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span class="text-emerald-400">Online</span>
            `;
            this.statusElement.className = 'fixed bottom-4 right-4 z-[60] flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium bg-emerald-900/50 border border-emerald-700/50 transition-all duration-300';

            // Fade out após 3s quando online
            setTimeout(() => {
                if (this.isOnline && this.statusElement) {
                    this.statusElement.style.opacity = '0';
                }
            }, 3000);
        } else {
            this.statusElement.innerHTML = `
                <span class="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span class="text-orange-400">Offline</span>
            `;
            this.statusElement.className = 'fixed bottom-4 right-4 z-[60] flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium bg-orange-900/50 border border-orange-700/50 transition-all duration-300';
            this.statusElement.style.opacity = '1';
        }
    },

    /**
     * Mostra indicador temporariamente
     */
    flash() {
        if (!this.statusElement) return;

        this.statusElement.style.opacity = '1';
        setTimeout(() => {
            if (this.isOnline) {
                this.statusElement.style.opacity = '0';
            }
        }, 3000);
    },

    /**
     * Verifica conexão e retorna status
     */
    check() {
        this.isOnline = navigator.onLine;
        this.updateIndicator();
        return this.isOnline;
    },

    /**
     * Aguarda reconexão
     * @returns {Promise} resolve quando online
     */
    waitForConnection() {
        return new Promise(resolve => {
            if (this.isOnline) {
                resolve();
                return;
            }

            const handler = () => {
                window.removeEventListener('online', handler);
                resolve();
            };
            window.addEventListener('online', handler);
        });
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ConnectionStatus.init());
} else {
    ConnectionStatus.init();
}

// Export global
window.ConnectionStatus = ConnectionStatus;
