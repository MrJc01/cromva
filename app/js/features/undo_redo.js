/**
 * Cromva Undo/Redo Manager
 * Sistema de desfazer/refazer para o editor
 */

const UndoManager = {
    // Pilhas de estados
    undoStack: [],
    redoStack: [],

    // Limite máximo de estados
    maxHistory: 100,

    // Estado atual
    currentState: null,

    /**
     * Inicializa o gerenciador para um textarea
     */
    init(textareaId = 'modal-textarea') {
        this.textarea = typeof textareaId === 'string'
            ? document.getElementById(textareaId)
            : textareaId;

        if (!this.textarea) return;

        // Salvar estado inicial
        this.currentState = this.getState();

        // Listener para mudanças
        this.textarea.addEventListener('input', () => {
            this.saveState();
        });

        // Registrar atalhos
        if (typeof KeyboardManager !== 'undefined') {
            KeyboardManager.register('ctrl+z', () => this.undo(), {
                name: 'Desfazer',
                global: false
            });
            KeyboardManager.register('ctrl+shift+z', () => this.redo(), {
                name: 'Refazer',
                global: false
            });
            KeyboardManager.register('ctrl+y', () => this.redo(), {
                name: 'Refazer (Alt)',
                global: false
            });
        }

        console.log('[UndoManager] Initialized');
    },

    /**
     * Obtém estado atual do textarea
     */
    getState() {
        if (!this.textarea) return null;
        return {
            content: this.textarea.value,
            selectionStart: this.textarea.selectionStart,
            selectionEnd: this.textarea.selectionEnd,
            timestamp: Date.now()
        };
    },

    /**
     * Aplica um estado ao textarea
     */
    applyState(state) {
        if (!this.textarea || !state) return;

        this.textarea.value = state.content;
        this.textarea.selectionStart = state.selectionStart;
        this.textarea.selectionEnd = state.selectionEnd;

        // Disparar evento input para atualizar preview
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    },

    /**
     * Salva estado atual na pilha de undo
     */
    saveState() {
        const newState = this.getState();

        // Ignorar se não mudou
        if (this.currentState && newState.content === this.currentState.content) {
            return;
        }

        // Adicionar estado anterior à pilha de undo
        if (this.currentState) {
            this.undoStack.push(this.currentState);

            // Limitar tamanho
            if (this.undoStack.length > this.maxHistory) {
                this.undoStack.shift();
            }
        }

        // Limpar redo stack quando há nova ação
        this.redoStack = [];

        // Atualizar estado atual
        this.currentState = newState;
    },

    /**
     * Desfaz última ação
     */
    undo() {
        if (this.undoStack.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Nada para desfazer');
            }
            return false;
        }

        // Mover estado atual para redo
        if (this.currentState) {
            this.redoStack.push(this.currentState);
        }

        // Recuperar estado anterior
        this.currentState = this.undoStack.pop();
        this.applyState(this.currentState);

        console.log('[UndoManager] Undo:', this.undoStack.length, 'remaining');
        return true;
    },

    /**
     * Refaz última ação desfeita
     */
    redo() {
        if (this.redoStack.length === 0) {
            if (typeof showToast === 'function') {
                showToast('Nada para refazer');
            }
            return false;
        }

        // Mover estado atual para undo
        if (this.currentState) {
            this.undoStack.push(this.currentState);
        }

        // Recuperar estado do redo
        this.currentState = this.redoStack.pop();
        this.applyState(this.currentState);

        console.log('[UndoManager] Redo:', this.redoStack.length, 'remaining');
        return true;
    },

    /**
     * Limpa todo o histórico
     */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.currentState = this.getState();
    },

    /**
     * Retorna se pode desfazer
     */
    canUndo() {
        return this.undoStack.length > 0;
    },

    /**
     * Retorna se pode refazer
     */
    canRedo() {
        return this.redoStack.length > 0;
    },

    /**
     * Retorna estatísticas
     */
    getStats() {
        return {
            undoCount: this.undoStack.length,
            redoCount: this.redoStack.length,
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        };
    }
};

// Export global
window.UndoManager = UndoManager;
