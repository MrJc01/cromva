/**
 * Cromva Debug Panel
 * Painel visual de debug para desenvolvimento
 */

const DebugPanel = {
    isVisible: false,
    panel: null,
    updateInterval: null,

    /**
     * Inicializa o debug panel
     */
    init() {
        this.createPanel();
        this.registerShortcut();
        console.log('[DebugPanel] Initialized');
    },

    /**
     * Cria o painel
     */
    createPanel() {
        if (document.getElementById('debug-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.className = 'fixed bottom-4 left-4 z-[90] hidden bg-zinc-900/95 border border-zinc-700 rounded-xl shadow-2xl w-80 max-h-96 overflow-hidden backdrop-blur';
        panel.innerHTML = `
            <div class="flex items-center justify-between p-3 border-b border-zinc-700 bg-zinc-800/50">
                <span class="text-sm font-medium text-zinc-200">🔧 Debug Panel</span>
                <button id="debug-close" class="text-zinc-500 hover:text-white text-sm">✕</button>
            </div>
            <div id="debug-content" class="p-3 overflow-y-auto max-h-72 text-xs font-mono text-zinc-400 space-y-3">
            </div>
            <div class="p-2 border-t border-zinc-700 flex gap-2">
                <button onclick="DebugPanel.refresh()" class="flex-1 px-2 py-1 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700">Refresh</button>
                <button onclick="DebugPanel.clearStorage()" class="flex-1 px-2 py-1 text-xs bg-red-900/30 text-red-400 rounded hover:bg-red-900/50">Clear Storage</button>
            </div>
        `;

        document.body.appendChild(panel);
        this.panel = panel;

        document.getElementById('debug-close').addEventListener('click', () => this.hide());
    },

    /**
     * Mostra o painel
     */
    show() {
        if (!this.panel) return;
        this.panel.classList.remove('hidden');
        this.isVisible = true;
        this.refresh();

        // Auto-refresh
        this.updateInterval = setInterval(() => this.refresh(), 2000);
    },

    /**
     * Esconde o painel
     */
    hide() {
        if (!this.panel) return;
        this.panel.classList.add('hidden');
        this.isVisible = false;

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    },

    /**
     * Alterna visibilidade
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    },

    /**
     * Atualiza conteúdo
     */
    refresh() {
        const content = document.getElementById('debug-content');
        if (!content) return;

        const notes = window.notes || [];
        const workspaces = window.workspaces || [];
        const files = window.workspaceFiles || {};

        // Calcular uso de memória
        const storage = this.getStorageUsage();

        content.innerHTML = `
            <div class="space-y-3">
                <!-- Status -->
                <div class="p-2 bg-zinc-800/50 rounded-lg">
                    <div class="text-zinc-300 font-medium mb-1">📊 Status</div>
                    <div class="grid grid-cols-2 gap-1">
                        <span>Online:</span>
                        <span class="${navigator.onLine ? 'text-emerald-400' : 'text-orange-400'}">${navigator.onLine ? '✓' : '✗'}</span>
                        <span>Tema:</span>
                        <span class="text-zinc-200">${localStorage.getItem('cromva-theme') || 'dark'}</span>
                    </div>
                </div>

                <!-- Dados -->
                <div class="p-2 bg-zinc-800/50 rounded-lg">
                    <div class="text-zinc-300 font-medium mb-1">📂 Dados</div>
                    <div class="grid grid-cols-2 gap-1">
                        <span>Notas:</span>
                        <span class="text-emerald-400">${notes.length}</span>
                        <span>Workspaces:</span>
                        <span class="text-blue-400">${workspaces.length}</span>
                        <span>Arquivos:</span>
                        <span class="text-purple-400">${Object.values(files).flat().length}</span>
                        <span>Favoritos:</span>
                        <span class="text-yellow-400">${window.Favorites?.getAll()?.length || 0}</span>
                    </div>
                </div>

                <!-- Storage -->
                <div class="p-2 bg-zinc-800/50 rounded-lg">
                    <div class="text-zinc-300 font-medium mb-1">💾 Storage</div>
                    <div class="grid grid-cols-2 gap-1">
                        <span>LocalStorage:</span>
                        <span class="text-zinc-200">${storage.localStorage}</span>
                        <span>IndexedDB:</span>
                        <span class="text-zinc-200">${storage.indexedDB}</span>
                    </div>
                </div>

                <!-- Módulos -->
                <div class="p-2 bg-zinc-800/50 rounded-lg">
                    <div class="text-zinc-300 font-medium mb-1">🔌 Módulos</div>
                    <div class="flex flex-wrap gap-1">
                        ${this.getLoadedModules().map(m =>
            `<span class="px-1.5 py-0.5 bg-emerald-900/30 text-emerald-400 rounded text-[10px]">${m}</span>`
        ).join('')}
                    </div>
                </div>

                <!-- Eventos Recentes -->
                <div class="p-2 bg-zinc-800/50 rounded-lg">
                    <div class="text-zinc-300 font-medium mb-1">📡 Eventos</div>
                    <div class="text-[10px] text-zinc-500">
                        ${window.CromvaEvents?._eventLog?.slice(-5).reverse().map(e =>
            `<div>${e.event}: ${new Date(e.time).toLocaleTimeString()}</div>`
        ).join('') || 'Nenhum evento registrado'}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Calcula uso de storage
     */
    getStorageUsage() {
        let localStorageSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                localStorageSize += localStorage[key].length * 2; // UTF-16
            }
        }

        return {
            localStorage: this.formatBytes(localStorageSize),
            indexedDB: 'N/A' // Precisa de async para calcular
        };
    },

    /**
     * Formata bytes
     */
    formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    },

    /**
     * Lista módulos carregados
     */
    getLoadedModules() {
        const modules = [];
        const checks = [
            'CromvaConfig', 'CromvaEvents', 'CromvaUI', 'CromvaData',
            'FSHandler', 'HandleStore', 'KeyboardManager', 'ThemeManager',
            'FileSorter', 'FileSearch', 'ContextMenu', 'ConfirmModal',
            'UndoManager', 'LineCounter', 'EditorToolbar', 'FindReplace',
            'FocusMode', 'Favorites', 'MarkdownPreview', 'MultiSelect',
            'ConnectionStatus', 'FilePreview', 'Breadcrumb', 'OnboardingTour',
            'OfflineMode'
        ];

        for (const mod of checks) {
            if (window[mod]) {
                modules.push(mod.replace('Cromva', ''));
            }
        }

        return modules;
    },

    /**
     * Limpa localStorage
     */
    clearStorage() {
        if (confirm('Tem certeza? Isso irá limpar todos os dados locais.')) {
            localStorage.clear();
            location.reload();
        }
    },

    /**
     * Registra atalho
     */
    registerShortcut() {
        if (typeof KeyboardManager !== 'undefined') {
            KeyboardManager.register('ctrl+shift+d', () => this.toggle(), {
                name: 'Debug Panel',
                global: true
            });
        }
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DebugPanel.init());
} else {
    DebugPanel.init();
}

// Export global
window.DebugPanel = DebugPanel;
