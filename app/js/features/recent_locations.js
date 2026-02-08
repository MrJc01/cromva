/**
 * Cromva Recent Locations
 * Histórico de locais recentes para o location picker
 */

const RecentLocations = {
    STORAGE_KEY: 'cromva-recent-locations',
    MAX_ITEMS: 10,
    locations: [],

    /**
     * Inicializa o sistema
     */
    init() {
        this.load();
        console.log('[RecentLocations] Initialized with', this.locations.length, 'items');
    },

    /**
     * Carrega do localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                this.locations = JSON.parse(saved);
            }
        } catch (e) {
            console.error('[RecentLocations] Error loading:', e);
        }
    },

    /**
     * Salva no localStorage
     */
    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.locations));
        } catch (e) {
            console.error('[RecentLocations] Error saving:', e);
        }
    },

    /**
     * Adiciona um local ao histórico
     */
    add(location) {
        // Remover se já existe
        this.locations = this.locations.filter(l => l.path !== location.path);

        // Adicionar no início
        this.locations.unshift({
            path: location.path,
            name: location.name,
            workspaceId: location.workspaceId,
            type: location.type || 'folder',
            timestamp: Date.now()
        });

        // Limitar tamanho
        if (this.locations.length > this.MAX_ITEMS) {
            this.locations = this.locations.slice(0, this.MAX_ITEMS);
        }

        this.save();
        console.log('[RecentLocations] Added:', location.path);
    },

    /**
     * Remove um local
     */
    remove(path) {
        this.locations = this.locations.filter(l => l.path !== path);
        this.save();
    },

    /**
     * Retorna todos os locais recentes
     */
    getAll() {
        return this.locations;
    },

    /**
     * Retorna locais de um workspace específico
     */
    getByWorkspace(workspaceId) {
        return this.locations.filter(l => l.workspaceId === workspaceId);
    },

    /**
     * Limpa histórico
     */
    clear() {
        this.locations = [];
        this.save();
    },

    /**
     * Renderiza lista de locais recentes
     */
    render(containerId) {
        const container = typeof containerId === 'string'
            ? document.getElementById(containerId)
            : containerId;

        if (!container) return;

        if (this.locations.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-zinc-500 text-sm">
                    Nenhum local recente
                </div>
            `;
            return;
        }

        let html = `
            <div class="space-y-1">
                <div class="text-xs text-zinc-500 px-2 mb-2">Locais Recentes</div>
        `;

        for (const location of this.locations) {
            const icon = location.type === 'file' ? '📄' : '📁';
            const time = this.formatTime(location.timestamp);

            html += `
                <button class="recent-location-item w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                        data-path="${location.path}"
                        data-workspace="${location.workspaceId}">
                    <span>${icon}</span>
                    <span class="flex-1 truncate">${location.name}</span>
                    <span class="text-xs text-zinc-600">${time}</span>
                </button>
            `;
        }

        html += '</div>';
        container.innerHTML = html;

        // Attach listeners
        container.querySelectorAll('.recent-location-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const path = btn.dataset.path;
                const wsId = btn.dataset.workspace;

                if (typeof CromvaEvents !== 'undefined') {
                    CromvaEvents.emit('location:selected', { path, workspaceId: wsId });
                }
            });
        });
    },

    /**
     * Formata timestamp
     */
    formatTime(timestamp) {
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (mins < 1) return 'agora';
        if (mins < 60) return `${mins}m`;
        if (hours < 24) return `${hours}h`;
        return `${days}d`;
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => RecentLocations.init());
} else {
    RecentLocations.init();
}

// Export global
window.RecentLocations = RecentLocations;
