/**
 * Cromva WorkspaceManager Namespace
 * Namespace unificado para gestão de workspaces
 */

const WorkspaceManager = {
    // Estado
    state: {
        currentWorkspaceId: null,
        workspaces: [],
        files: {}
    },

    /**
     * Inicializa o gerenciador
     */
    init() {
        // Carregar workspaces do estado global
        this.state.workspaces = window.workspaces || [];
        this.state.files = window.workspaceFiles || {};

        console.log('[WorkspaceManager] Initialized with', this.state.workspaces.length, 'workspaces');
    },

    /**
     * Retorna todos os workspaces
     */
    getAll() {
        return this.state.workspaces;
    },

    /**
     * Retorna workspace por ID
     */
    get(id) {
        return this.state.workspaces.find(w => w.id === id);
    },

    /**
     * Retorna workspace atual
     */
    getCurrent() {
        return this.get(this.state.currentWorkspaceId);
    },

    /**
     * Define workspace atual
     */
    setCurrent(id) {
        const workspace = this.get(id);
        if (!workspace) {
            console.error('[WorkspaceManager] Workspace not found:', id);
            return false;
        }

        this.state.currentWorkspaceId = id;
        window.currentWorkspaceId = id;

        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('workspace:changed', { workspaceId: id, workspace });
        }

        console.log('[WorkspaceManager] Current workspace:', id);
        return true;
    },

    /**
     * Cria novo workspace
     */
    create(name, options = {}) {
        const id = Date.now();
        const workspace = {
            id,
            name,
            type: options.type || 'local',
            handle: options.handle || null,
            createdAt: new Date().toISOString(),
            ...options
        };

        this.state.workspaces.push(workspace);
        window.workspaces = this.state.workspaces;

        if (typeof saveData === 'function') {
            saveData();
        }

        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('workspace:created', { workspace });
        }

        console.log('[WorkspaceManager] Created workspace:', name);
        return workspace;
    },

    /**
     * Remove workspace
     */
    async remove(id) {
        const index = this.state.workspaces.findIndex(w => w.id === id);
        if (index === -1) return false;

        // Confirmar
        if (typeof ConfirmModal !== 'undefined') {
            const ok = await ConfirmModal.confirmDelete('Workspace');
            if (!ok) return false;
        }

        const workspace = this.state.workspaces[index];
        this.state.workspaces.splice(index, 1);
        window.workspaces = this.state.workspaces;

        // Limpar arquivos associados
        delete this.state.files[id];
        delete window.workspaceFiles[id];

        if (typeof saveData === 'function') {
            saveData();
        }

        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('workspace:removed', { workspaceId: id });
        }

        console.log('[WorkspaceManager] Removed workspace:', id);
        return true;
    },

    /**
     * Renomeia workspace
     */
    rename(id, newName) {
        const workspace = this.get(id);
        if (!workspace) return false;

        workspace.name = newName;
        workspace.updatedAt = new Date().toISOString();

        if (typeof saveData === 'function') {
            saveData();
        }

        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('workspace:renamed', { workspaceId: id, name: newName });
        }

        return true;
    },

    /**
     * Retorna arquivos de um workspace
     */
    getFiles(workspaceId = null) {
        const id = workspaceId || this.state.currentWorkspaceId;
        return this.state.files[id] || [];
    },

    /**
     * Adiciona arquivo a um workspace
     */
    addFile(workspaceId, file) {
        if (!this.state.files[workspaceId]) {
            this.state.files[workspaceId] = [];
        }

        this.state.files[workspaceId].push(file);
        window.workspaceFiles = this.state.files;

        return true;
    },

    /**
     * Remove arquivo de um workspace
     */
    removeFile(workspaceId, fileId) {
        if (!this.state.files[workspaceId]) return false;

        const index = this.state.files[workspaceId].findIndex(f => f.id === fileId);
        if (index === -1) return false;

        this.state.files[workspaceId].splice(index, 1);
        window.workspaceFiles = this.state.files;

        return true;
    },

    /**
     * Conta total de arquivos
     */
    getTotalFileCount() {
        let count = 0;
        for (const files of Object.values(this.state.files)) {
            count += files.length;
        }
        return count;
    },

    /**
     * Busca arquivos
     */
    searchFiles(query, workspaceId = null) {
        const files = workspaceId
            ? this.getFiles(workspaceId)
            : Object.values(this.state.files).flat();

        const q = query.toLowerCase();
        return files.filter(f => f.name?.toLowerCase().includes(q));
    }
};

// Export global
window.WorkspaceManager = WorkspaceManager;
