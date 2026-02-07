/**
 * Cromva Workspace UI
 * Componentes de UI separados para workspaces
 */

const WorkspaceUI = {
    /**
     * Renderiza lista de workspaces
     */
    renderList(containerId, workspaces = []) {
        const container = typeof containerId === 'string'
            ? document.getElementById(containerId)
            : containerId;

        if (!container) return;

        if (workspaces.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-zinc-500">
                    <div class="text-4xl mb-2">📁</div>
                    <p>Nenhum workspace</p>
                    <button onclick="WorkspaceUI.showCreateModal()" class="mt-3 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-500">
                        Criar Workspace
                    </button>
                </div>
            `;
            return;
        }

        let html = '<div class="space-y-2">';

        for (const ws of workspaces) {
            const isActive = ws.id === window.currentWorkspaceId;
            const fileCount = (window.workspaceFiles?.[ws.id] || []).length;
            const icon = ws.type === 'local' ? '💾' : '☁️';

            html += `
                <div class="workspace-item p-3 rounded-lg border transition-all cursor-pointer
                     ${isActive ? 'bg-emerald-900/30 border-emerald-600/50' : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'}"
                     data-id="${ws.id}"
                     onclick="WorkspaceUI.select(${ws.id})">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="text-xl">${icon}</span>
                            <div>
                                <div class="font-medium text-zinc-200">${this.escapeHtml(ws.name)}</div>
                                <div class="text-xs text-zinc-500">${fileCount} arquivo(s)</div>
                            </div>
                        </div>
                        <button class="workspace-menu-btn p-1 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100"
                                onclick="event.stopPropagation(); WorkspaceUI.showMenu(${ws.id}, event)">
                            ⋮
                        </button>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;
    },

    /**
     * Renderiza dropdown de workspaces
     */
    renderDropdown(workspaces = [], currentId = null) {
        let html = '<select id="workspace-select" class="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300">';

        for (const ws of workspaces) {
            const selected = ws.id === currentId ? 'selected' : '';
            html += `<option value="${ws.id}" ${selected}>${this.escapeHtml(ws.name)}</option>`;
        }

        html += '</select>';
        return html;
    },

    /**
     * Renderiza card de workspace
     */
    renderCard(workspace) {
        const fileCount = (window.workspaceFiles?.[workspace.id] || []).length;
        const icon = workspace.type === 'local' ? '💾' : '☁️';
        const date = new Date(workspace.createdAt).toLocaleDateString();

        return `
            <div class="workspace-card p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl hover:border-zinc-600 transition-all">
                <div class="flex items-start justify-between mb-3">
                    <span class="text-2xl">${icon}</span>
                    <span class="text-xs text-zinc-500">${date}</span>
                </div>
                <h3 class="font-medium text-zinc-200 mb-1">${this.escapeHtml(workspace.name)}</h3>
                <p class="text-xs text-zinc-500">${fileCount} arquivo(s)</p>
                <div class="flex gap-2 mt-3">
                    <button onclick="WorkspaceUI.select(${workspace.id})" 
                            class="flex-1 px-3 py-1.5 text-xs bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600">
                        Abrir
                    </button>
                    <button onclick="WorkspaceUI.showMenu(${workspace.id}, event)" 
                            class="px-2 py-1.5 text-xs text-zinc-500 hover:text-white">
                        ⋮
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Renderiza grid de cards
     */
    renderGrid(containerId, workspaces = []) {
        const container = typeof containerId === 'string'
            ? document.getElementById(containerId)
            : containerId;

        if (!container) return;

        if (workspaces.length === 0) {
            this.renderList(containerId, workspaces);
            return;
        }

        let html = '<div class="grid grid-cols-2 md:grid-cols-3 gap-4">';

        for (const ws of workspaces) {
            html += this.renderCard(ws);
        }

        html += '</div>';
        container.innerHTML = html;
    },

    /**
     * Seleciona workspace
     */
    select(id) {
        if (typeof WorkspaceManager !== 'undefined') {
            WorkspaceManager.setCurrent(id);
        } else {
            window.currentWorkspaceId = id;
        }

        // Re-renderizar notas
        if (typeof renderNotes === 'function') {
            renderNotes();
        }

        showToast('Workspace selecionado');
    },

    /**
     * Mostra menu de contexto
     */
    showMenu(id, event) {
        event.preventDefault();
        event.stopPropagation();

        if (typeof ContextMenu !== 'undefined') {
            ContextMenu.show([
                {
                    label: '✏️ Renomear',
                    action: () => this.showRenameModal(id)
                },
                {
                    label: '📂 Abrir pasta',
                    action: () => this.openFolder(id),
                    condition: () => {
                        const ws = (window.workspaces || []).find(w => w.id === id);
                        return ws?.type === 'local';
                    }
                },
                { separator: true },
                {
                    label: '🗑️ Excluir',
                    action: () => this.delete(id),
                    danger: true
                }
            ], event.clientX, event.clientY);
        }
    },

    /**
     * Mostra modal de criação
     */
    showCreateModal() {
        const name = prompt('Nome do workspace:');
        if (!name) return;

        if (typeof WorkspaceManager !== 'undefined') {
            WorkspaceManager.create(name);
        } else {
            const id = Date.now();
            window.workspaces = window.workspaces || [];
            window.workspaces.push({ id, name, createdAt: new Date().toISOString() });
            if (typeof saveData === 'function') saveData();
        }

        showToast('Workspace criado!');

        // Re-renderizar
        if (typeof renderWorkspaces === 'function') {
            renderWorkspaces();
        }
    },

    /**
     * Mostra modal de renomear
     */
    showRenameModal(id) {
        const ws = (window.workspaces || []).find(w => w.id === id);
        if (!ws) return;

        const name = prompt('Novo nome:', ws.name);
        if (!name || name === ws.name) return;

        if (typeof WorkspaceManager !== 'undefined') {
            WorkspaceManager.rename(id, name);
        } else {
            ws.name = name;
            if (typeof saveData === 'function') saveData();
        }

        showToast('Workspace renomeado!');
    },

    /**
     * Exclui workspace
     */
    async delete(id) {
        if (typeof WorkspaceManager !== 'undefined') {
            await WorkspaceManager.remove(id);
        } else {
            if (!confirm('Excluir workspace?')) return;
            window.workspaces = (window.workspaces || []).filter(w => w.id !== id);
            if (typeof saveData === 'function') saveData();
        }

        showToast('Workspace excluído!');
    },

    /**
     * Abre pasta no sistema
     */
    openFolder(id) {
        // Apenas funciona com handles de pasta
        showToast('Use o explorador de arquivos do sistema');
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
};

// Export global
window.WorkspaceUI = WorkspaceUI;
