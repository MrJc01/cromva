/**
 * Cromva Editor Namespace
 * Namespace unificado para o editor
 */

const Editor = {
    // Estado do editor
    state: {
        currentNoteId: null,
        isEditing: false,
        hasUnsavedChanges: false,
        lastSavedContent: ''
    },

    // Referências de elementos
    elements: {
        textarea: null,
        preview: null,
        toolbar: null,
        modal: null
    },

    /**
     * Inicializa o editor
     */
    init() {
        this.elements.textarea = document.getElementById('modal-textarea');
        this.elements.preview = document.getElementById('modal-preview');
        this.elements.modal = document.getElementById('modal');

        // Inicializar sub-módulos se disponíveis
        if (typeof UndoManager !== 'undefined') {
            UndoManager.init(this.elements.textarea);
        }
        if (typeof LineCounter !== 'undefined') {
            LineCounter.init(this.elements.textarea);
        }
        if (typeof EditorToolbar !== 'undefined') {
            EditorToolbar.init(this.elements.textarea);
        }
        if (typeof FindReplace !== 'undefined') {
            FindReplace.init(this.elements.textarea);
        }
        if (typeof MarkdownPreview !== 'undefined') {
            MarkdownPreview.init(this.elements.textarea, this.elements.preview);
        }
        if (typeof ImageDragDrop !== 'undefined') {
            ImageDragDrop.init(this.elements.textarea);
        }

        console.log('[Editor] Namespace initialized');
    },

    /**
     * Abre o editor com uma nota
     */
    open(noteId) {
        const note = window.notes?.find(n => n.id === noteId);
        if (!note) {
            console.error('[Editor] Note not found:', noteId);
            return false;
        }

        this.state.currentNoteId = noteId;
        this.state.isEditing = true;
        this.state.lastSavedContent = note.content || '';
        this.state.hasUnsavedChanges = false;

        // Preencher campos
        if (this.elements.textarea) {
            this.elements.textarea.value = note.content || '';
        }

        // Abrir modal
        if (this.elements.modal) {
            this.elements.modal.classList.remove('hidden');
        }

        // Inicializar undo/redo
        if (typeof UndoManager !== 'undefined') {
            UndoManager.clear();
        }

        // Emitir evento
        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('editor:opened', { noteId, note });
        }

        console.log('[Editor] Opened note:', noteId);
        return true;
    },

    /**
     * Fecha o editor
     */
    close(forceClose = false) {
        if (this.state.hasUnsavedChanges && !forceClose) {
            // Perguntar se quer salvar
            if (typeof ConfirmModal !== 'undefined') {
                ConfirmModal.show({
                    title: 'Alterações não salvas',
                    message: 'Você tem alterações não salvas. Deseja salvar antes de fechar?',
                    confirmText: 'Salvar',
                    cancelText: 'Descartar',
                    type: 'warning'
                }).then(save => {
                    if (save) {
                        this.save();
                    }
                    this.forceClose();
                });
                return;
            }
        }

        this.forceClose();
    },

    /**
     * Fecha forçadamente
     */
    forceClose() {
        this.state.currentNoteId = null;
        this.state.isEditing = false;
        this.state.hasUnsavedChanges = false;

        if (this.elements.modal) {
            this.elements.modal.classList.add('hidden');
        }

        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('editor:closed');
        }

        console.log('[Editor] Closed');
    },

    /**
     * Salva a nota atual
     */
    save() {
        if (!this.state.currentNoteId) return false;

        const content = this.elements.textarea?.value || '';
        const noteIndex = window.notes?.findIndex(n => n.id === this.state.currentNoteId);

        if (noteIndex === -1) return false;

        // Atualizar nota
        window.notes[noteIndex].content = content;
        window.notes[noteIndex].updatedAt = new Date().toISOString();

        // Salvar no localStorage
        if (typeof saveData === 'function') {
            saveData();
        }

        this.state.lastSavedContent = content;
        this.state.hasUnsavedChanges = false;

        // Emitir evento
        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('editor:saved', { noteId: this.state.currentNoteId });
        }

        showToast('Nota salva ✓');
        console.log('[Editor] Saved note:', this.state.currentNoteId);
        return true;
    },

    /**
     * Retorna o conteúdo atual
     */
    getContent() {
        return this.elements.textarea?.value || '';
    },

    /**
     * Define o conteúdo
     */
    setContent(content) {
        if (this.elements.textarea) {
            this.elements.textarea.value = content;
            this.elements.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    },

    /**
     * Marca como alterado
     */
    markAsChanged() {
        const currentContent = this.getContent();
        this.state.hasUnsavedChanges = currentContent !== this.state.lastSavedContent;
    },

    /**
     * Verifica se tem alterações
     */
    hasChanges() {
        return this.state.hasUnsavedChanges;
    },

    /**
     * Retorna nota atual
     */
    getCurrentNote() {
        if (!this.state.currentNoteId) return null;
        return window.notes?.find(n => n.id === this.state.currentNoteId);
    }
};

// Export global
window.Editor = Editor;
