const CanvasList = {
    init() {
        this.container = document.getElementById('canvas-dashboard');
        this.grid = document.getElementById('canvas-list-grid');

        // Hook into sidebar toggle to adjust layout if needed? 
        // Not strictly necessary if using flex/grid.
    },

    show() {
        if (!this.container) return;

        // Hide Canvas & Sidebar
        document.getElementById('canvas-wrapper').classList.add('hidden');
        document.getElementById('canvas-sidebar').classList.add('hidden');
        document.getElementById('canvas-nav-controls')?.classList.add('hidden');

        // Show Dashboard
        this.container.classList.remove('hidden');

        this.render();
    },

    hide() {
        if (!this.container) return;
        this.container.classList.add('hidden');

        // Show Canvas & Sidebar
        document.getElementById('canvas-wrapper').classList.remove('hidden');
        document.getElementById('canvas-sidebar').classList.remove('hidden');
        document.getElementById('canvas-nav-controls')?.classList.remove('hidden');

        // Refresh canvas size
        if (CanvasManager && CanvasManager.resizeCanvas) {
            CanvasManager.resizeCanvas();
        }
    },

    async render() {
        if (!this.grid) return;
        this.grid.innerHTML = '';

        // 1. Get all .board files from current workspace
        const wsId = window.currentWorkspaceId;
        if (!wsId) {
            this.grid.innerHTML = '<p class="text-zinc-500 col-span-full text-center">Selecione um workspace para ver os quadros.</p>';
            return;
        }

        const files = await this.getBoardFiles(wsId);

        // 2. Render user boards
        files.forEach(file => {
            const card = this.createBoardCard(file);
            this.grid.appendChild(card);
        });

        // 3. Render "New Board" card always? Or maybe it's a separate button.
        // Let's create a "New Board" card as the first item
        const newCard = document.createElement('div');
        newCard.className = 'bg-zinc-800/50 hover:bg-zinc-800 border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group h-48';
        newCard.onclick = () => this.createNewBoard();
        newCard.innerHTML = `
            <div class="w-12 h-12 rounded-full bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center transition-colors">
                <i data-lucide="plus" class="w-6 h-6 text-zinc-400 group-hover:text-white"></i>
            </div>
            <span class="text-zinc-400 group-hover:text-white font-medium">Novo Quadro</span>
        `;
        this.grid.prepend(newCard);

        if (window.lucide) lucide.createIcons();
    },

    async getBoardFiles(wsId) {
        if (!window.workspaceFiles || !window.workspaceFiles[wsId]) return [];

        const boards = [];
        const rootHandle = FSHandler.handles[wsId];

        // Helper to check validity
        const isValidHandle = (h) => h && (typeof h.getFile === 'function' || h.kind === 'file');

        // Helper to restore handle
        const restoreHandle = async (item, parentHandle) => {
            if (isValidHandle(item.handle)) return true;
            if (!parentHandle) return false;

            try {
                // Try to get handle from parent
                if (item.type === 'file') {
                    item.handle = await parentHandle.getFileHandle(item.name);
                    return true;
                } else if (item.type === 'folder') {
                    item.handle = await parentHandle.getDirectoryHandle(item.name);
                    return true;
                }
            } catch (e) {
                // console.warn('Failed to restore handle for:', item.name);
                return false;
            }
            return false;
        };

        // We need an async traversal to await handle restoration
        // Using a queue or recursive async function
        const traverse = async (items, parentHandle) => {
            for (const item of items) {
                // Attempt to restore handle for current item (folder or file)
                await restoreHandle(item, parentHandle);

                if (item.type === 'file' && item.name.endsWith('.board')) {
                    if (isValidHandle(item.handle)) {
                        boards.push(item);
                    } else {
                        console.warn('Invalid handle for board (could not restore):', item.name);
                    }
                } else if (item.type === 'folder' && item.children) {
                    // Recurse with the (hopefully) restored directory handle
                    // If directory handle is missing, we can't look inside technically, 
                    // unless we skip handle check and just rely on path naming? 
                    // But for getFileHandle we need the dir handle.
                    if (isValidHandle(item.handle)) {
                        await traverse(item.children, item.handle);
                    } else {
                        // Try sub-traverse anyway? No, can't get children handles without parent handle
                        console.warn('Skipping folder due to missing handle:', item.name);
                    }
                }
            }
        };

        // Start traversal from root
        await traverse(window.workspaceFiles[wsId], rootHandle);
        return boards;
    },

    createBoardCard(file) {
        const div = document.createElement('div');
        div.className = 'glass p-5 rounded-xl cursor-pointer hover:border-zinc-500 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 group flex flex-col h-48 relative border-zinc-800 border';
        div.onclick = () => {
            if (CanvasNavigator) {
                // Ensure we proceed only if handle exists
                if (file.handle) {
                    CanvasNavigator.navigateTo(file.handle);
                    this.hide();
                } else {
                    console.error('File handle missing for board:', file.name);
                    alert('Erro ao abrir quadro: Handle do arquivo perdido.');
                }
            }
        };

        const date = new Date(file.lastModified || Date.now()).toLocaleDateString('pt-BR');
        const name = file.name.replace('.board', '');

        div.innerHTML = `
            <div class="flex-1 flex items-center justify-center bg-zinc-900/50 rounded-lg mb-4 overflow-hidden relative">
                <i data-lucide="layout-grid" class="w-8 h-8 text-zinc-700 group-hover:text-zinc-500 transition-colors"></i>
            </div>
            <div class="flex justify-between items-end">
                <div>
                    <h3 class="font-bold text-zinc-200 truncate pr-2">${name}</h3>
                    <p class="text-[10px] text-zinc-500">Editado em ${date}</p>
                </div>
            </div>
        `;
        return div;
    },

    createNewBoard() {
        const modal = document.getElementById('create-board-modal');
        const input = document.getElementById('new-board-name');
        if (modal && input) {
            input.value = '';
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => input.focus(), 100);

            // Handle Enter key
            input.onkeydown = (e) => {
                if (e.key === 'Enter') this.confirmCreateBoard();
                if (e.key === 'Escape') this.closeCreateModal();
            };
        }
    },

    closeCreateModal() {
        const modal = document.getElementById('create-board-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    async confirmCreateBoard() {
        const input = document.getElementById('new-board-name');
        const name = input.value.trim();
        if (!name) return;

        this.closeCreateModal();
        await this.createBoardFile(name);
    },

    async createBoardFile(name) {
        const filename = name.endsWith('.board') ? name : `${name}.board`;
        const wsId = window.currentWorkspaceId;

        if (!wsId || !FSHandler.handles[wsId]) {
            alert('Selecione um workspace válido.');
            return;
        }

        try {
            const wsHandle = FSHandler.handles[wsId];
            const fileHandle = await wsHandle.getFileHandle(filename, { create: true });

            // Initial content
            const initialData = {
                version: "5.3.0",
                objects: []
            };

            await FSHandler.saveFile(fileHandle, JSON.stringify(initialData));

            // Notify Workspace Manager to register the file
            // Since we don't have a clean API, we'll assume addFileToWorkspace is global 
            // OR manually update logic similar to workspaces.js

            if (typeof addFileToWorkspace === 'function') {
                // Construct a mock handle-like object or pass the real handle if supported
                // addFileToWorkspace expects a handle that has getFile()
                await addFileToWorkspace(wsId, fileHandle);
            } else {
                console.warn('addFileToWorkspace global function not found. Manual update.');
                // Manual update fallback
                if (window.workspaceFiles && window.workspaceFiles[wsId]) {
                    const fileData = await fileHandle.getFile();
                    const newFile = {
                        id: Date.now(),
                        name: filename,
                        type: 'file',
                        size: fileData.size,
                        status: 'visible',
                        locked: false,
                        handle: fileHandle
                    };
                    window.workspaceFiles[wsId].push(newFile);
                    if (typeof renderExplorer === 'function') renderExplorer(wsId);
                    if (typeof saveData === 'function') saveData();
                }
            }

            // Navigate to it
            if (CanvasNavigator) {
                await CanvasNavigator.navigateTo(fileHandle);
                this.hide();
            }

        } catch (e) {
            console.error('Error creating board:', e);
            alert('Erro ao criar quadro: ' + e.message);
        }
    }
};

window.CanvasList = CanvasList;
