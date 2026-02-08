/**
 * Cromva Batch Selection
 * Modo de seleção múltipla para location picker
 */

const BatchSelection = {
    isActive: false,
    selectedItems: new Set(),
    container: null,

    /**
     * Ativa o modo de seleção
     */
    activate(containerId) {
        this.isActive = true;
        this.selectedItems.clear();

        this.container = typeof containerId === 'string'
            ? document.getElementById(containerId)
            : containerId;

        this.updateUI();
        console.log('[BatchSelection] Activated');
    },

    /**
     * Desativa o modo de seleção
     */
    deactivate() {
        this.isActive = false;
        this.selectedItems.clear();
        this.removeToolbar();
        this.updateUI();
        console.log('[BatchSelection] Deactivated');
    },

    /**
     * Alterna modo de seleção
     */
    toggle(containerId) {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate(containerId);
        }
    },

    /**
     * Seleciona um item
     */
    select(id, data = null) {
        if (!this.isActive) return;

        this.selectedItems.add(id);
        this.updateItemUI(id, true);
        this.updateToolbar();

        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('batch:selected', { id, data, count: this.selectedItems.size });
        }
    },

    /**
     * Deseleciona um item
     */
    deselect(id) {
        if (!this.isActive) return;

        this.selectedItems.delete(id);
        this.updateItemUI(id, false);
        this.updateToolbar();

        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('batch:deselected', { id, count: this.selectedItems.size });
        }
    },

    /**
     * Alterna seleção de item
     */
    toggleItem(id, data = null) {
        if (this.selectedItems.has(id)) {
            this.deselect(id);
        } else {
            this.select(id, data);
        }
    },

    /**
     * Seleciona todos
     */
    selectAll(items) {
        if (!this.isActive) return;

        for (const item of items) {
            const id = item.id || item.name;
            this.selectedItems.add(id);
            this.updateItemUI(id, true);
        }

        this.updateToolbar();
    },

    /**
     * Deseleciona todos
     */
    deselectAll() {
        for (const id of this.selectedItems) {
            this.updateItemUI(id, false);
        }
        this.selectedItems.clear();
        this.updateToolbar();
    },

    /**
     * Retorna itens selecionados
     */
    getSelected() {
        return Array.from(this.selectedItems);
    },

    /**
     * Retorna contagem
     */
    getCount() {
        return this.selectedItems.size;
    },

    /**
     * Verifica se item está selecionado
     */
    isSelected(id) {
        return this.selectedItems.has(id);
    },

    /**
     * Atualiza UI de um item
     */
    updateItemUI(id, selected) {
        const element = document.querySelector(`[data-batch-id="${id}"]`);
        if (!element) return;

        if (selected) {
            element.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-900/20');
        } else {
            element.classList.remove('ring-2', 'ring-emerald-500', 'bg-emerald-900/20');
        }

        // Atualizar checkbox se existir
        const checkbox = element.querySelector('.batch-checkbox');
        if (checkbox) {
            checkbox.checked = selected;
        }
    },

    /**
     * Atualiza toda a UI
     */
    updateUI() {
        const items = document.querySelectorAll('[data-batch-id]');

        items.forEach(item => {
            const checkbox = item.querySelector('.batch-checkbox');

            if (this.isActive) {
                // Mostrar checkbox
                if (!checkbox) {
                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.className = 'batch-checkbox mr-2 accent-emerald-500';
                    cb.addEventListener('change', (e) => {
                        e.stopPropagation();
                        this.toggleItem(item.dataset.batchId);
                    });
                    item.insertBefore(cb, item.firstChild);
                }
            } else {
                // Remover checkbox
                if (checkbox) {
                    checkbox.remove();
                }
                item.classList.remove('ring-2', 'ring-emerald-500', 'bg-emerald-900/20');
            }
        });
    },

    /**
     * Atualiza toolbar
     */
    updateToolbar() {
        let toolbar = document.getElementById('batch-selection-toolbar');

        if (this.selectedItems.size === 0) {
            if (toolbar) toolbar.remove();
            return;
        }

        if (!toolbar) {
            toolbar = document.createElement('div');
            toolbar.id = 'batch-selection-toolbar';
            toolbar.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-3 flex items-center gap-3';
            document.body.appendChild(toolbar);
        }

        toolbar.innerHTML = `
            <span class="text-sm text-zinc-300">${this.selectedItems.size} selecionado(s)</span>
            <div class="w-px h-5 bg-zinc-700"></div>
            <button onclick="BatchSelection.onAction('move')" class="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700">
                📁 Mover
            </button>
            <button onclick="BatchSelection.onAction('copy')" class="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700">
                📋 Copiar
            </button>
            <button onclick="BatchSelection.onAction('delete')" class="px-3 py-1.5 text-xs bg-red-600/20 text-red-400 rounded hover:bg-red-600/30">
                🗑️ Deletar
            </button>
            <button onclick="BatchSelection.deselectAll()" class="px-2 py-1.5 text-xs text-zinc-500 hover:text-white">
                ✕
            </button>
        `;
    },

    /**
     * Remove toolbar
     */
    removeToolbar() {
        const toolbar = document.getElementById('batch-selection-toolbar');
        if (toolbar) toolbar.remove();
    },

    /**
     * Handler de ações
     */
    onAction(action) {
        const selected = this.getSelected();

        if (selected.length === 0) return;

        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('batch:action', { action, items: selected });
        }

        console.log('[BatchSelection] Action:', action, 'on', selected.length, 'items');
    }
};

// Export global
window.BatchSelection = BatchSelection;
