/**
 * Cromva Folder Navigation
 * Navegação de subpastas no location picker
 */

const FolderNavigation = {
    currentPath: [],
    rootHandle: null,
    history: [],
    historyIndex: -1,

    /**
     * Inicializa a navegação
     */
    init(rootHandle) {
        this.rootHandle = rootHandle;
        this.currentPath = [];
        this.history = [];
        this.historyIndex = -1;
        console.log('[FolderNavigation] Initialized');
    },

    /**
     * Navega para uma subpasta
     */
    async navigateTo(folderName) {
        try {
            const currentHandle = await this.getCurrentHandle();
            if (!currentHandle) {
                console.error('[FolderNavigation] No current handle');
                return false;
            }

            // Tentar obter handle da subpasta
            const subHandle = await currentHandle.getDirectoryHandle(folderName);

            // Adicionar ao caminho
            this.currentPath.push(folderName);

            // Adicionar ao histórico
            this.addToHistory([...this.currentPath]);

            // Emitir evento
            if (typeof CromvaEvents !== 'undefined') {
                CromvaEvents.emit('folder:navigated', { path: this.currentPath, handle: subHandle });
            }

            console.log('[FolderNavigation] Navigated to:', this.getPathString());
            return true;
        } catch (e) {
            console.error('[FolderNavigation] Navigate error:', e);
            showToast('Não foi possível acessar a pasta');
            return false;
        }
    },

    /**
     * Volta para a pasta pai
     */
    async navigateUp() {
        if (this.currentPath.length === 0) {
            return false;
        }

        this.currentPath.pop();
        this.addToHistory([...this.currentPath]);

        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('folder:navigated', { path: this.currentPath });
        }

        console.log('[FolderNavigation] Navigated up to:', this.getPathString() || 'root');
        return true;
    },

    /**
     * Navega para o root
     */
    navigateToRoot() {
        this.currentPath = [];
        this.addToHistory([]);

        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('folder:navigated', { path: [] });
        }

        console.log('[FolderNavigation] Navigated to root');
        return true;
    },

    /**
     * Navega para um índice específico do caminho
     */
    async navigateToIndex(index) {
        if (index < 0) {
            return this.navigateToRoot();
        }

        if (index >= this.currentPath.length) {
            return false;
        }

        this.currentPath = this.currentPath.slice(0, index + 1);
        this.addToHistory([...this.currentPath]);

        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('folder:navigated', { path: this.currentPath });
        }

        return true;
    },

    /**
     * Voltar no histórico
     */
    goBack() {
        if (this.historyIndex <= 0) return false;

        this.historyIndex--;
        this.currentPath = [...this.history[this.historyIndex]];

        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('folder:navigated', { path: this.currentPath, fromHistory: true });
        }

        return true;
    },

    /**
     * Avançar no histórico
     */
    goForward() {
        if (this.historyIndex >= this.history.length - 1) return false;

        this.historyIndex++;
        this.currentPath = [...this.history[this.historyIndex]];

        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('folder:navigated', { path: this.currentPath, fromHistory: true });
        }

        return true;
    },

    /**
     * Adiciona ao histórico
     */
    addToHistory(path) {
        // Remover histórico futuro se não estamos no final
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(path);
        this.historyIndex = this.history.length - 1;
    },

    /**
     * Retorna o handle atual
     */
    async getCurrentHandle() {
        if (!this.rootHandle) return null;

        let handle = this.rootHandle;

        for (const folder of this.currentPath) {
            try {
                handle = await handle.getDirectoryHandle(folder);
            } catch (e) {
                console.error('[FolderNavigation] Path broken at:', folder);
                return null;
            }
        }

        return handle;
    },

    /**
     * Lista conteúdo da pasta atual
     */
    async listCurrentFolder() {
        const handle = await this.getCurrentHandle();
        if (!handle) return [];

        const entries = [];

        try {
            for await (const entry of handle.values()) {
                entries.push({
                    name: entry.name,
                    kind: entry.kind,
                    handle: entry
                });
            }
        } catch (e) {
            console.error('[FolderNavigation] List error:', e);
        }

        // Ordenar: pastas primeiro, depois por nome
        entries.sort((a, b) => {
            if (a.kind !== b.kind) {
                return a.kind === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });

        return entries;
    },

    /**
     * Retorna o caminho como string
     */
    getPathString(separator = '/') {
        return this.currentPath.join(separator);
    },

    /**
     * Retorna breadcrumb
     */
    getBreadcrumb() {
        return [
            { name: '📁 Root', index: -1 },
            ...this.currentPath.map((name, index) => ({ name, index }))
        ];
    },

    /**
     * Verifica se pode voltar
     */
    canGoBack() {
        return this.historyIndex > 0;
    },

    /**
     * Verifica se pode avançar
     */
    canGoForward() {
        return this.historyIndex < this.history.length - 1;
    },

    /**
     * Verifica se pode subir
     */
    canGoUp() {
        return this.currentPath.length > 0;
    }
};

// Export global
window.FolderNavigation = FolderNavigation;
