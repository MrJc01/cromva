/**
 * Cromva Context Menu
 * Menu de contexto (right-click) para arquivos e notas
 */

const ContextMenu = {
    currentTarget: null,
    currentData: null,

    /**
     * Inicializa o sistema de menu de contexto
     */
    init() {
        // Criar elemento do menu se não existir
        if (!document.getElementById('context-menu')) {
            const html = `
                <div id="context-menu" class="fixed z-[100] hidden">
                    <div class="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl py-1 min-w-[180px] overflow-hidden">
                        <div id="context-menu-items"></div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', html);
        }

        // Fechar ao clicar fora
        document.addEventListener('click', () => this.hide());
        document.addEventListener('contextmenu', (e) => this.handleContextMenu(e));

        console.log('[ContextMenu] Initialized');
    },

    /**
     * Handler para evento de contextmenu
     */
    handleContextMenu(e) {
        // Verificar se o clique foi em um elemento com data-context
        const target = e.target.closest('[data-context]');
        if (!target) {
            this.hide();
            return;
        }

        e.preventDefault();

        const contextType = target.dataset.context;
        const contextId = target.dataset.id;
        const contextData = target.dataset;

        this.currentTarget = target;
        this.currentData = { type: contextType, id: contextId, ...contextData };

        // Mostrar menu apropriado
        this.showForType(contextType, e.clientX, e.clientY);
    },

    /**
     * Mostra menu baseado no tipo
     */
    showForType(type, x, y) {
        let items = [];

        switch (type) {
            case 'note':
                items = [
                    { icon: '📝', label: 'Abrir', action: () => this.actions.openNote() },
                    { icon: '✏️', label: 'Editar', action: () => this.actions.editNote() },
                    { divider: true },
                    { icon: '📋', label: 'Copiar Conteúdo', action: () => this.actions.copyContent() },
                    { icon: '📁', label: 'Mover para...', action: () => this.actions.moveNote() },
                    { icon: '📤', label: 'Exportar', action: () => this.actions.exportNote() },
                    { divider: true },
                    { icon: '🗑️', label: 'Deletar', action: () => this.actions.deleteNote(), danger: true }
                ];
                break;

            case 'file':
                items = [
                    { icon: '📂', label: 'Abrir no Editor', action: () => this.actions.openFile() },
                    { icon: '📋', label: 'Copiar Nome', action: () => this.actions.copyFileName() },
                    { divider: true },
                    { icon: '🔄', label: 'Recarregar', action: () => this.actions.reloadFile() },
                    { icon: '🗑️', label: 'Remover da Lista', action: () => this.actions.removeFile(), danger: true }
                ];
                break;

            case 'workspace':
                items = [
                    { icon: '📂', label: 'Abrir', action: () => this.actions.openWorkspace() },
                    { icon: '✏️', label: 'Renomear', action: () => this.actions.renameWorkspace() },
                    { icon: '🔄', label: 'Reconectar Pasta', action: () => this.actions.reconnectWorkspace() },
                    { divider: true },
                    { icon: '🗑️', label: 'Remover', action: () => this.actions.removeWorkspace(), danger: true }
                ];
                break;

            default:
                return;
        }

        this.show(items, x, y);
    },

    /**
     * Renderiza e mostra o menu
     */
    show(items, x, y) {
        const menu = document.getElementById('context-menu');
        const itemsContainer = document.getElementById('context-menu-items');

        let html = '';
        for (const item of items) {
            if (item.divider) {
                html += '<div class="border-t border-zinc-700 my-1"></div>';
            } else {
                const dangerClass = item.danger ? 'text-red-400 hover:bg-red-500/20' : 'text-zinc-300 hover:bg-zinc-800';
                html += `
                    <button class="w-full px-3 py-2 text-left text-sm ${dangerClass} flex items-center gap-2 transition-colors"
                            data-action="${items.indexOf(item)}">
                        <span>${item.icon}</span>
                        <span>${item.label}</span>
                    </button>
                `;
            }
        }

        itemsContainer.innerHTML = html;

        // Adicionar listeners
        itemsContainer.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.action);
                const item = items[index];
                if (item && item.action) {
                    item.action();
                }
                this.hide();
            });
        });

        // Posicionar
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.classList.remove('hidden');

        // Ajustar se sair da tela
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = `${window.innerWidth - rect.width - 10}px`;
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = `${window.innerHeight - rect.height - 10}px`;
        }
    },

    /**
     * Esconde o menu
     */
    hide() {
        const menu = document.getElementById('context-menu');
        if (menu) menu.classList.add('hidden');
        this.currentTarget = null;
        this.currentData = null;
    },

    /**
     * Ações do menu
     */
    actions: {
        // Note actions
        openNote() {
            const id = parseInt(ContextMenu.currentData.id);
            if (typeof openPreview === 'function') openPreview(id);
        },

        editNote() {
            const id = parseInt(ContextMenu.currentData.id);
            if (typeof openPreview === 'function') {
                openPreview(id);
                setTimeout(() => {
                    if (typeof setEditorMode === 'function') setEditorMode('edit');
                }, 100);
            }
        },

        async copyContent() {
            const id = parseInt(ContextMenu.currentData.id);
            const note = window.notes.find(n => n.id === id);
            if (note) {
                await navigator.clipboard.writeText(note.content);
                showToast('Conteúdo copiado!');
            }
        },

        moveNote() {
            const id = parseInt(ContextMenu.currentData.id);
            if (typeof LocationPicker !== 'undefined' && LocationPicker.open) {
                LocationPicker.open(id);
            }
        },

        async exportNote() {
            const id = parseInt(ContextMenu.currentData.id);
            const note = window.notes.find(n => n.id === id);
            if (note) {
                const content = `# ${note.title}\n\n${note.content}`;
                const blob = new Blob([content], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `${note.title.replace(/[^a-z0-9]/gi, '_')}.md`;
                a.click();
                URL.revokeObjectURL(url);

                showToast('Nota exportada!');
            }
        },

        async deleteNote() {
            const id = parseInt(ContextMenu.currentData.id);
            const note = window.notes.find(n => n.id === id);
            if (note) {
                const ok = await ConfirmModal.confirmDelete(note.title);
                if (ok) {
                    window.notes = window.notes.filter(n => n.id !== id);
                    saveData();
                    renderNotes();
                    showToast('Nota deletada');
                }
            }
        },

        // File actions
        openFile() {
            const id = parseInt(ContextMenu.currentData.id);
            if (typeof openPreview === 'function') openPreview(id);
        },

        async copyFileName() {
            const name = ContextMenu.currentData.name;
            if (name) {
                await navigator.clipboard.writeText(name);
                showToast('Nome copiado!');
            }
        },

        reloadFile() {
            showToast('Funcionalidade em desenvolvimento');
        },

        removeFile() {
            showToast('Funcionalidade em desenvolvimento');
        },

        // Workspace actions
        openWorkspace() {
            const id = parseInt(ContextMenu.currentData.id);
            if (id) {
                window.currentWorkspaceId = id;
                saveData();
                renderNotes();
                showToast('Workspace aberto');
            }
        },

        renameWorkspace() {
            showToast('Funcionalidade em desenvolvimento');
        },

        async reconnectWorkspace() {
            if (typeof FSHandler !== 'undefined' && FSHandler.openDirectory) {
                await FSHandler.openDirectory();
            }
        },

        async removeWorkspace() {
            const id = parseInt(ContextMenu.currentData.id);
            const ws = window.workspaces.find(w => w.id === id);
            if (ws) {
                const ok = await ConfirmModal.confirmDelete(ws.name);
                if (ok) {
                    window.workspaces = window.workspaces.filter(w => w.id !== id);
                    delete window.workspaceFiles[id];
                    saveData();
                    showToast('Workspace removido');
                    // Re-render se necessário
                    if (typeof renderWorkspaces === 'function') renderWorkspaces();
                }
            }
        }
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ContextMenu.init());
} else {
    ContextMenu.init();
}

// Export global
window.ContextMenu = ContextMenu;
