/**
 * Cromva Keyboard Shortcuts Manager
 * Sistema completo de atalhos de teclado
 */

const KeyboardManager = {
    // Mapa de atalhos registrados
    shortcuts: new Map(),

    // Se está ativo
    enabled: true,

    /**
     * Inicializa o gerenciador de atalhos
     */
    init() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.registerDefaultShortcuts();
        console.log('[Keyboard] Manager initialized');
    },

    /**
     * Normaliza uma combinação de teclas
     */
    normalizeKey(e) {
        const parts = [];
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');

        // Normalizar a tecla
        let key = e.key.toLowerCase();
        if (key === ' ') key = 'space';
        if (key === 'escape') key = 'esc';
        if (key === 'arrowup') key = 'up';
        if (key === 'arrowdown') key = 'down';
        if (key === 'arrowleft') key = 'left';
        if (key === 'arrowright') key = 'right';

        // Ignorar modificadores sozinhos
        if (['control', 'alt', 'shift', 'meta'].includes(key)) {
            return null;
        }

        parts.push(key);
        return parts.join('+');
    },

    /**
     * Handler principal de keydown
     */
    handleKeyDown(e) {
        if (!this.enabled) return;

        const combo = this.normalizeKey(e);
        if (!combo) return;

        const shortcut = this.shortcuts.get(combo);
        if (shortcut) {
            // Verificar se estamos em um input
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

            // Se é global ou não estamos em input, executar
            if (shortcut.global || !isInput) {
                e.preventDefault();
                e.stopPropagation();

                try {
                    shortcut.handler(e);

                    // Emitir evento
                    if (typeof CromvaEvents !== 'undefined') {
                        CromvaEvents.emit(CromvaEvents.NAV_SHORTCUT_PRESSED, {
                            shortcut: combo,
                            name: shortcut.name
                        });
                    }
                } catch (err) {
                    console.error(`[Keyboard] Error executing shortcut ${combo}:`, err);
                }
            }
        }
    },

    /**
     * Registra um atalho
     * @param {string} combo - Combinação de teclas (ex: 'ctrl+s')
     * @param {Function} handler - Função a executar
     * @param {Object} options - { name, description, global: boolean }
     */
    register(combo, handler, options = {}) {
        const normalizedCombo = combo.toLowerCase().replace(/\s/g, '');

        this.shortcuts.set(normalizedCombo, {
            combo: normalizedCombo,
            handler,
            name: options.name || combo,
            description: options.description || '',
            global: options.global !== false // true por padrão
        });
    },

    /**
     * Remove um atalho
     */
    unregister(combo) {
        this.shortcuts.delete(combo.toLowerCase().replace(/\s/g, ''));
    },

    /**
     * Lista todos os atalhos registrados
     */
    list() {
        const list = [];
        this.shortcuts.forEach((value, key) => {
            list.push({
                combo: key,
                name: value.name,
                description: value.description,
                global: value.global
            });
        });
        return list;
    },

    /**
     * Mostra modal de ajuda com atalhos
     */
    showHelp() {
        const list = this.list();

        let html = `
            <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" id="keyboard-help-modal" onclick="if(e.target===this)this.remove()">
                <div class="bg-zinc-900 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl font-bold text-white">⌨️ Atalhos de Teclado</h2>
                        <button onclick="this.closest('#keyboard-help-modal').remove()" class="text-zinc-400 hover:text-white">✕</button>
                    </div>
                    <div class="space-y-2">
        `;

        for (const shortcut of list) {
            const keys = shortcut.combo.split('+').map(k =>
                `<kbd class="px-2 py-1 bg-zinc-800 rounded text-zinc-300 text-xs font-mono">${k}</kbd>`
            ).join(' + ');

            html += `
                <div class="flex items-center justify-between py-2 border-b border-zinc-800">
                    <span class="text-zinc-300">${shortcut.name}</span>
                    <span>${keys}</span>
                </div>
            `;
        }

        html += `
                    </div>
                    <p class="text-zinc-500 text-sm mt-4">Pressione <kbd class="px-2 py-1 bg-zinc-800 rounded text-xs">?</kbd> para abrir este menu</p>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    },

    /**
     * Registra os atalhos padrão da aplicação
     */
    registerDefaultShortcuts() {
        // Salvar nota
        this.register('ctrl+s', () => {
            if (!document.getElementById('preview-modal').classList.contains('hidden')) {
                if (typeof saveCurrentNote === 'function') saveCurrentNote();
            }
        }, { name: 'Salvar Nota', description: 'Salva a nota atual' });

        // Nova nota
        this.register('ctrl+n', (e) => {
            if (typeof openEmptyEditor === 'function') openEmptyEditor();
        }, { name: 'Nova Nota', description: 'Cria uma nova nota' });

        // Busca (Spotlight)
        this.register('ctrl+k', () => {
            if (typeof openSpotlight === 'function') openSpotlight();
        }, { name: 'Buscar', description: 'Abre o Spotlight' });

        // Toggle sidebar
        this.register('ctrl+b', () => {
            if (typeof toggleSidebar === 'function') toggleSidebar();
        }, { name: 'Toggle Sidebar', description: 'Mostra/esconde a sidebar' });

        // Fechar modal
        this.register('esc', () => {
            // Fechar qualquer modal aberto
            const modals = document.querySelectorAll('[id$="-modal"]:not(.hidden)');
            modals.forEach(modal => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            });

            // Fechar keyboard help se aberto
            const help = document.getElementById('keyboard-help-modal');
            if (help) help.remove();
        }, { name: 'Fechar', description: 'Fecha modais' });

        // Toggle modo de edição
        this.register('ctrl+e', () => {
            if (!document.getElementById('preview-modal').classList.contains('hidden')) {
                if (typeof setEditorMode === 'function') setEditorMode('edit');
            }
        }, { name: 'Modo Edição', description: 'Alterna para modo de edição' });

        // Toggle preview
        this.register('ctrl+p', (e) => {
            e.preventDefault(); // Prevenir print dialog
            if (!document.getElementById('preview-modal').classList.contains('hidden')) {
                if (typeof setEditorMode === 'function') setEditorMode('preview');
            }
        }, { name: 'Modo Preview', description: 'Alterna para preview' });

        // Split view
        this.register('ctrl+\\', () => {
            if (!document.getElementById('preview-modal').classList.contains('hidden')) {
                if (typeof setEditorMode === 'function') setEditorMode('split');
            }
        }, { name: 'Modo Split', description: 'Divide edição e preview' });

        // Ajuda
        this.register('shift+/', () => {
            this.showHelp();
        }, { name: 'Ajuda', description: 'Mostra atalhos de teclado' });

        // Views
        this.register('alt+1', () => {
            if (typeof switchView === 'function') switchView('grid');
        }, { name: 'Vista Grid', description: 'Muda para vista grid' });

        this.register('alt+2', () => {
            if (typeof switchView === 'function') switchView('graph');
        }, { name: 'Vista Graph', description: 'Muda para vista graph' });

        this.register('alt+3', () => {
            if (typeof switchView === 'function') switchView('canvas');
        }, { name: 'Vista Canvas', description: 'Muda para infinite canvas' });

        // Workspaces
        this.register('ctrl+shift+w', () => {
            if (typeof openWorkspaceManager === 'function') openWorkspaceManager();
        }, { name: 'Workspaces', description: 'Abre gerenciador de workspaces' });

        // Settings
        this.register('ctrl+,', () => {
            const modal = document.getElementById('settings-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        }, { name: 'Configurações', description: 'Abre configurações' });

        console.log(`[Keyboard] Registered ${this.shortcuts.size} shortcuts`);
    }
};

// Auto-init quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => KeyboardManager.init());
} else {
    // Aguardar um tick para garantir que outras funções existam
    setTimeout(() => KeyboardManager.init(), 100);
}

// Export global
window.KeyboardManager = KeyboardManager;
