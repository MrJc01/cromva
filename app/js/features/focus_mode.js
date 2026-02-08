/**
 * Cromva Focus Mode (Zen Mode)
 * Modo de escrita sem distrações
 */

const FocusMode = {
    isActive: false,
    originalState: null,

    /**
     * Ativa/desativa modo foco
     */
    toggle() {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
        return this.isActive;
    },

    /**
     * Ativa modo foco
     */
    activate() {
        if (this.isActive) return;

        // Salvar estado original
        this.originalState = {
            sidebarVisible: !document.getElementById('file-sidebar')?.classList.contains('hidden'),
            toolbarVisible: !document.getElementById('editor-toolbar')?.classList.contains('hidden')
        };

        // Esconder elementos
        this.hideElements();

        // Criar overlay escuro
        this.createOverlay();

        // Focar no textarea
        const textarea = document.getElementById('modal-textarea');
        if (textarea) {
            textarea.focus();
        }

        this.isActive = true;

        // Registrar atalho para sair
        document.addEventListener('keydown', this.handleEscape);

        showToast('Modo Foco ativado (Esc para sair)');
        console.log('[FocusMode] Activated');
    },

    /**
     * Desativa modo foco
     */
    deactivate() {
        if (!this.isActive) return;

        // Restaurar elementos
        this.showElements();

        // Remover overlay
        this.removeOverlay();

        this.isActive = false;

        // Remover listener
        document.removeEventListener('keydown', this.handleEscape);

        showToast('Modo Foco desativado');
        console.log('[FocusMode] Deactivated');
    },

    /**
     * Handler para Esc
     */
    handleEscape(e) {
        if (e.key === 'Escape' && FocusMode.isActive) {
            FocusMode.deactivate();
        }
    },

    /**
     * Esconde elementos da UI
     */
    hideElements() {
        // Esconder sidebar
        const sidebar = document.getElementById('file-sidebar');
        if (sidebar) sidebar.classList.add('hidden');

        // Esconder header se existir
        const header = document.querySelector('header');
        if (header) header.classList.add('focus-hidden');

        // Esconder toolbar
        const toolbar = document.getElementById('editor-toolbar');
        if (toolbar) toolbar.classList.add('hidden');

        // Expandir área do editor
        const editorArea = document.getElementById('modal-content');
        if (editorArea) {
            editorArea.classList.add('focus-mode-active');
        }
    },

    /**
     * Mostra elementos escondidos
     */
    showElements() {
        // Restaurar baseado no estado original
        const sidebar = document.getElementById('file-sidebar');
        if (sidebar && this.originalState?.sidebarVisible) {
            sidebar.classList.remove('hidden');
        }

        const header = document.querySelector('header');
        if (header) header.classList.remove('focus-hidden');

        const toolbar = document.getElementById('editor-toolbar');
        if (toolbar && this.originalState?.toolbarVisible) {
            toolbar.classList.remove('hidden');
        }

        const editorArea = document.getElementById('modal-content');
        if (editorArea) {
            editorArea.classList.remove('focus-mode-active');
        }
    },

    /**
     * Cria overlay de foco
     */
    createOverlay() {
        if (document.getElementById('focus-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'focus-overlay';
        overlay.innerHTML = `
            <style>
                #focus-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.9);
                    z-index: 40;
                    animation: fadeIn 0.3s ease;
                }
                .focus-mode-active {
                    position: relative;
                    z-index: 50;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .focus-hidden {
                    display: none !important;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            </style>
        `;

        document.body.appendChild(overlay);
    },

    /**
     * Remove overlay
     */
    removeOverlay() {
        const overlay = document.getElementById('focus-overlay');
        if (overlay) {
            overlay.remove();
        }
    },

    /**
     * Registra atalhos
     */
    registerShortcuts() {
        if (typeof KeyboardManager !== 'undefined') {
            KeyboardManager.register('ctrl+shift+f', () => this.toggle(), {
                name: 'Modo Foco',
                description: 'Ativa/desativa modo de escrita sem distrações',
                global: true
            });
        }
    }
};

// Registrar atalhos na inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FocusMode.registerShortcuts());
} else {
    FocusMode.registerShortcuts();
}

// Export global
window.FocusMode = FocusMode;
