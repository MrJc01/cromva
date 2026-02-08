/**
 * Cromva Multi Selection
 * Sistema de multi-seleção de arquivos
 */

const MultiSelect = {
    selectedItems: new Set(),
    isSelecting: false,
    containerSelector: '#note-list',

    /**
     * Inicializa o sistema
     */
    init(containerSelector = '#note-list') {
        this.containerSelector = containerSelector;
        this.container = document.querySelector(containerSelector);

        // Atalhos
        this.registerShortcuts();

        console.log('[MultiSelect] Initialized');
    },

    /**
     * Alterna seleção de um item
     */
    toggle(id) {
        id = String(id);
        if (this.selectedItems.has(id)) {
            this.deselect(id);
        } else {
            this.select(id);
        }
        return this.selectedItems.has(id);
    },

    /**
     * Seleciona um item
     */
    select(id) {
        id = String(id);
        this.selectedItems.add(id);
        this.updateVisual(id, true);
        this.emitChange();
    },

    /**
     * Deseleciona um item
     */
    deselect(id) {
        id = String(id);
        this.selectedItems.delete(id);
        this.updateVisual(id, false);
        this.emitChange();
    },

    /**
     * Seleciona todos
     */
    selectAll() {
        const container = document.querySelector(this.containerSelector);
        if (!container) return;

        const items = container.querySelectorAll('[data-id]');
        items.forEach(item => {
            const id = item.dataset.id;
            this.selectedItems.add(id);
            this.updateVisual(id, true);
        });

        this.emitChange();
        showToast(`${this.selectedItems.size} itens selecionados`);
    },

    /**
     * Deseleciona todos
     */
    deselectAll() {
        this.selectedItems.forEach(id => {
            this.updateVisual(id, false);
        });
        this.selectedItems.clear();
        this.emitChange();
    },

    /**
     * Atualiza visual do item
     */
    updateVisual(id, isSelected) {
        const element = document.querySelector(`[data-id="${id}"]`);
        if (!element) return;

        if (isSelected) {
            element.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-900/20');
        } else {
            element.classList.remove('ring-2', 'ring-emerald-500', 'bg-emerald-900/20');
        }
    },

    /**
     * Emite evento de mudança
     */
    emitChange() {
        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('multiselect:changed', {
                count: this.selectedItems.size,
                items: [...this.selectedItems]
            });
        }

        this.updateToolbar();
    },

    /**
     * Atualiza toolbar de ações em lote
     */
    updateToolbar() {
        let toolbar = document.getElementById('multiselect-toolbar');

        if (this.selectedItems.size === 0) {
            if (toolbar) toolbar.remove();
            return;
        }

        if (!toolbar) {
            toolbar = document.createElement('div');
            toolbar.id = 'multiselect-toolbar';
            toolbar.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-3 flex items-center gap-3 animate-slide-up';
            document.body.appendChild(toolbar);
        }

        toolbar.innerHTML = `
            <span class="text-sm text-zinc-300">${this.selectedItems.size} selecionado(s)</span>
            <div class="w-px h-5 bg-zinc-700"></div>
            <button onclick="MultiSelect.moveSelected()" class="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700">
                📁 Mover
            </button>
            <button onclick="MultiSelect.deleteSelected()" class="px-3 py-1.5 text-xs bg-red-600/20 text-red-400 rounded hover:bg-red-600/30">
                🗑️ Deletar
            </button>
            <button onclick="MultiSelect.deselectAll()" class="px-2 py-1.5 text-xs text-zinc-500 hover:text-white">
                ✕
            </button>
        `;
    },

    /**
     * Move itens selecionados
     */
    async moveSelected() {
        showToast('Funcionalidade em desenvolvimento');
    },

    /**
     * Deleta itens selecionados
     */
    async deleteSelected() {
        const count = this.selectedItems.size;
        if (count === 0) return;

        const ok = await ConfirmModal.show({
            title: 'Deletar Itens',
            message: `Tem certeza que deseja deletar ${count} item(ns)?`,
            confirmText: 'Deletar',
            type: 'danger'
        });

        if (!ok) return;

        // Deletar do array de notas
        const ids = [...this.selectedItems].map(Number);
        window.notes = window.notes.filter(n => !ids.includes(n.id));

        saveData();
        renderNotes();

        this.deselectAll();
        showToast(`${count} item(ns) deletado(s)`);
    },

    /**
     * Retorna IDs selecionados
     */
    getSelected() {
        return [...this.selectedItems];
    },

    /**
     * Verifica se item está selecionado
     */
    isSelected(id) {
        return this.selectedItems.has(String(id));
    },

    /**
     * Registra atalhos
     */
    registerShortcuts() {
        if (typeof KeyboardManager === 'undefined') return;

        KeyboardManager.register('ctrl+a', () => {
            // Só seleciona all se não estiver em input/textarea
            const active = document.activeElement;
            if (active?.tagName !== 'INPUT' && active?.tagName !== 'TEXTAREA') {
                this.selectAll();
            }
        }, { name: 'Selecionar Todos', global: true });

        KeyboardManager.register('escape', () => {
            if (this.selectedItems.size > 0) {
                this.deselectAll();
            }
        }, { name: 'Limpar Seleção', global: true });
    }
};

// Export global
window.MultiSelect = MultiSelect;
