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

        // Add Configuration Card (Small)
        const configCard = document.createElement('div');
        configCard.className = 'bg-zinc-900/30 hover:bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group h-48';
        configCard.onclick = () => this.setDefaultLocation();
        configCard.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-zinc-800/50 group-hover:bg-zinc-700/50 flex items-center justify-center transition-colors">
                <i data-lucide="folder-cog" class="w-5 h-5 text-zinc-500 group-hover:text-zinc-300"></i>
            </div>
            <span class="text-zinc-500 group-hover:text-zinc-300 text-xs text-center">Configurar<br>Local Salvo</span>
        `;
        this.grid.appendChild(configCard);

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
                    // Always add to list, even if handle is invalid (we can fix on click)
                    boards.push(item);
                    if (!isValidHandle(item.handle)) {
                        // console.warn('Pending handle for board:', item.name);
                    }
                } else if (item.type === 'folder' && item.children) {
                    // Recurse
                    if (isValidHandle(item.handle)) {
                        await traverse(item.children, item.handle);
                    } else {
                        // If parent has no handle, we can't get children handles easily, 
                        // BUT we should still traverse if we want to show files that we know exist (from cache)
                        // The issue is 'restoreHandle' needs parent. 
                        // If we skip restoreHandle, we just pass null?
                        await traverse(item.children, null);
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

        div.onclick = async () => {
            if (CanvasNavigator) {
                // 1. Check if handle exists and is valid
                if (file.handle) {
                    // Check permission on the fly? CanvasNavigator usually handles it?
                    // Let's rely on CanvasNavigator to fail or we check here.
                    const perm = await FSHandler.checkPermission(file.handle, 'read');
                    if (perm === 'granted') {
                        CanvasNavigator.navigateTo(file.handle);
                    } else {
                        // Try to request permission on the FILE handle directly
                        const granted = await FSHandler.requestPermission(file.handle, 'read');
                        if (granted) {
                            CanvasNavigator.navigateTo(file.handle);
                        } else {
                            // If file handle verify fails, maybe we need the WORKSPACE handle permissions?
                            const wsId = window.currentWorkspaceId;
                            if (wsId && FSHandler.handles[wsId]) {
                                const wsGranted = await FSHandler.requestPermission(FSHandler.handles[wsId], 'readwrite');
                                if (wsGranted) {
                                    // Re-fetch file handle? or just try nav
                                    // We might need to refresh the handle object itself if it was invalidated
                                    CanvasNavigator.navigateTo(file.handle);
                                } else {
                                    alert('Permissão negada. Não é possível abrir o quadro.');
                                }
                            } else {
                                alert('Conexão com o arquivo perdida. Recarregue a pasta.');
                            }
                        }
                    }
                    this.hide();
                } else {
                    // No handle at all (phantom file from cache)
                    // Try to restore via Workspace Root
                    const wsId = window.currentWorkspaceId;
                    const root = FSHandler.handles[wsId];
                    if (root) {
                        const granted = await FSHandler.requestPermission(root, 'readwrite');
                        if (granted) {
                            // Refresh logic or try to grab handle now?
                            // Simple hack: refresh workspace and tell user to try again
                            await window.refreshAllWorkspaces();
                            this.render(); // Re-render with new handles
                            alert('Permissão restaurada! Tente abrir o quadro novamente.');
                        } else {
                            alert('É necessário dar permissão à pasta do workspace.');
                        }
                    } else {
                        console.error('File handle missing for board:', file.name);
                        alert('Erro: Arquivo não encontrado e Workspace desconectado.');
                    }
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

    async setDefaultLocation() {
        try {
            const handle = await window.showDirectoryPicker({
                id: 'cromva-boards',
                mode: 'readwrite'
            });

            if (handle) {
                await HandleStore.save('DEFAULT_BOARD_LOCATION', handle, 'directory');
                console.log('[CanvasList] Default board location set:', handle.name);
                showToast(`Local padrão definido: ${handle.name}`);
                this.render(); // Update UI if needed
            }
        } catch (e) {
            console.warn('User cancelled directory picker or error:', e);
        }
    },

    async createBoardFile(name) {
        const filename = name.endsWith('.board') ? name : `${name}.board`;

        let targetHandle = null;
        let wsId = window.currentWorkspaceId; // Default to current workspace for registering file if possible

        // 1. Try Default Location from HandleStore
        try {
            const defaultHandle = await HandleStore.get('DEFAULT_BOARD_LOCATION');
            if (defaultHandle) {
                // Verify permission
                const hasPerm = await HandleStore.checkPermission(defaultHandle);
                if (hasPerm) {
                    targetHandle = defaultHandle;
                    console.log('[CanvasList] Using DEFAULT_BOARD_LOCATION:', defaultHandle.name);
                } else {
                    // Request permission
                    const granted = await HandleStore.requestPermission(defaultHandle);
                    if (granted) {
                        targetHandle = defaultHandle;
                    } else {
                        console.warn('[CanvasList] Permission denied for default location.');
                    }
                }
            }
        } catch (e) {
            console.warn('[CanvasList] Error checking default location:', e);
        }

        // 2. If no default, try Current Workspace Root
        if (!targetHandle) {
            if (wsId && FSHandler.handles[wsId]) {
                targetHandle = FSHandler.handles[wsId];
                console.log('[CanvasList] Using Workspace Root:', targetHandle.name);
            }
        }

        // 3. Fallback: Prompt User (Save As...) - actually, showDirectoryPicker for just a folder
        // Effectively "saving" to a new location if nothing else works.
        if (!targetHandle) {
            const confirmPick = confirm('Nenhum local padrão ou workspace definido. Deseja selecionar uma pasta para salvar?');
            if (confirmPick) {
                try {
                    targetHandle = await window.showDirectoryPicker();
                    // Optional: ask to save as default?
                } catch (e) {
                    // User cancelled
                    return;
                }
            } else {
                return;
            }
        }

        if (!targetHandle) {
            alert('Não foi possível determinar onde salvar o arquivo.');
            return;
        }

        try {
            // Create the file in the resolved folder
            const fileHandle = await targetHandle.getFileHandle(filename, { create: true });

            // Initial content
            const initialData = {
                version: "5.3.0",
                objects: []
            };

            await FSHandler.saveFile(fileHandle, JSON.stringify(initialData));

            // Notify Workspace Manager to register the file
            // Since we don't have a clean API, we'll assume addFileToWorkspace is global
            // OR manually update logic similar to workspaces.js

            // IMPORTANT: If we saved to a separate folder (Default Location), it might NOT be part of the current workspace!
            // We should add it as a "linked folder" or just open it?
            // For now, if we are in a workspace, try to add it. If strictly separate, maybe just open.

            if (wsId && typeof addFileToWorkspace === 'function') {
                // Construct a mock handle-like object or pass the real handle if supported
                // addFileToWorkspace expects a handle that has getFile()
                // BUT addFileToWorkspace assumes adding to CURRENT VIEW list.
                // If the file is outside, it won't show up unless we link the folder.

                // If targetHandle is the Workspace Root, proceed as normal.
                // If targetHandle is different, we might want to "Import" that file into workspace view?
                // Or simply open it.

                if (targetHandle === FSHandler.handles[wsId]) {
                    await addFileToWorkspace(wsId, fileHandle);
                } else {
                    // External file?
                    // Let's just open it.
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
