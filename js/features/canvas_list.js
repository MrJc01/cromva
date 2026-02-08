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
                // Check if Virtual File (Imported)
                if (file.isVirtual && file.content) {
                    try {
                        const data = JSON.parse(file.content);
                        if (typeof BoardPersistence !== 'undefined') BoardPersistence.sanitizeData(data);

                        CanvasManager.canvas.loadFromJSON(data, () => {
                            CanvasManager.canvas.renderAll();
                            console.log('[CanvasList] Virtual board loaded.');
                            // We need to set currentFileHandle to null or a mock so auto-save doesn't overwrite wrong file
                            if (typeof BoardPersistence !== 'undefined') {
                                BoardPersistence.currentFileHandle = null;
                                // Maybe show warning that it's read-only until saved?
                                showToast('Quadro virtual carregado (modo leitura). Salve para editar permanentemente.', 'info');
                            }
                        });
                        this.hide();
                    } catch (e) {
                        console.error('Failed to load virtual board:', e);
                        alert('Erro ao carregar quadro virtual.');
                    }
                    return;
                }

                // Normal File Handle Logic
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

        const menuId = `board-menu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        div.innerHTML = `
            <div class="flex-1 flex items-center justify-center bg-zinc-900/50 rounded-lg mb-4 overflow-hidden relative">
                <i data-lucide="layout-grid" class="w-8 h-8 text-zinc-700 group-hover:text-zinc-500 transition-colors"></i>
            </div>
            <div class="flex justify-between items-end relative">
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-zinc-200 truncate pr-2">${name}</h3>
                    <p class="text-[10px] text-zinc-500">Editado em ${date}</p>
                </div>
                
                <div class="relative">
                    <button class="p-1 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        onclick="event.stopPropagation(); CanvasList.toggleBoardMenu('${menuId}')">
                        <i data-lucide="more-vertical" class="w-4 h-4"></i>
                    </button>
                    
                    <!-- Dropdown Menu -->
                    <div id="${menuId}" class="hidden absolute right-0 bottom-full mb-1 w-32 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden">
                        <button onclick="event.stopPropagation(); CanvasList.handleBoardAction('rename', '${file.name}', '${window.currentWorkspaceId}')" 
                            class="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2">
                            <i data-lucide="pencil" class="w-3 h-3"></i> Renomear
                        </button>
                        <button onclick="event.stopPropagation(); CanvasList.handleBoardAction('duplicate', '${file.name}', '${window.currentWorkspaceId}')" 
                            class="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2">
                            <i data-lucide="copy" class="w-3 h-3"></i> Duplicar
                        </button>
                        <button onclick="event.stopPropagation(); CanvasList.handleBoardAction('move', '${file.name}', '${window.currentWorkspaceId}')" 
                            class="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2">
                            <i data-lucide="folder-input" class="w-3 h-3"></i> Mover
                        </button>
                        <div class="h-px bg-zinc-800 my-0.5"></div>
                        <button onclick="event.stopPropagation(); CanvasList.handleBoardAction('delete', '${file.name}', '${window.currentWorkspaceId}')" 
                            class="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 flex items-center gap-2">
                            <i data-lucide="trash-2" class="w-3 h-3"></i> Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;
        return div;
    },

    toggleBoardMenu(menuId) {
        // Close all other menus first
        document.querySelectorAll('[id^="board-menu-"]').forEach(el => {
            if (el.id !== menuId) el.classList.add('hidden');
        });

        const menu = document.getElementById(menuId);
        if (menu) {
            menu.classList.toggle('hidden');

            if (!menu.classList.contains('hidden')) {
                // Auto-close on click outside
                setTimeout(() => {
                    const closeHandler = (e) => {
                        if (!menu.contains(e.target)) {
                            menu.classList.add('hidden');
                            document.removeEventListener('click', closeHandler);
                        }
                    };
                    document.addEventListener('click', closeHandler);
                }, 0);
            }
        }
    },

    async handleBoardAction(action, fileName, wsId) {
        // Close menus
        document.querySelectorAll('[id^="board-menu-"]').forEach(el => el.classList.add('hidden'));

        // Find file object (we might need to re-fetch if we only have name/wsId)
        // Ideally we pass the file object or handle, but sticking to primitive params for HTML onclick
        // We can re-find it from window.workspaceFiles or getBoardFiles

        // Quick find from cache
        let fileObj = null;
        const findRecursively = (items) => {
            for (const item of items) {
                if (item.name === fileName) return item;
                if (item.children) {
                    const found = findRecursively(item.children);
                    if (found) return found;
                }
            }
            return null;
        };

        if (window.workspaceFiles && window.workspaceFiles[wsId]) {
            fileObj = findRecursively(window.workspaceFiles[wsId]);
        }

        if (!fileObj) {
            // Fallback: Try to reconstruct if persistent info is enough?
            // Actually, for delete/rename we absolutely need the handle.
            console.error('File object not found for action:', fileName);
            // If it's a board, maybe we can find it via getBoardFiles?
            const updates = await this.getBoardFiles(wsId);
            fileObj = updates.find(f => f.name === fileName);
        }

        if (!fileObj || !fileObj.handle) {
            alert('Erro: Arquivo não acessível ou sem permissão.');
            return;
        }

        const handle = fileObj.handle;

        try {
            switch (action) {
                case 'rename':
                    await this.renameBoard(handle, fileName);
                    break;
                case 'delete':
                    await this.confirmDeleteBoard(handle, fileName);
                    break;
                case 'duplicate':
                    await this.duplicateBoard(handle, fileName);
                    break;
                case 'move':
                    await this.moveBoard(handle, fileName);
                    break;
            }
        } catch (e) {
            console.error('Action failed:', e);
            alert(`Erro na ação ${action}: ` + e.message);
        }
    },

    async renameBoard(handle, oldName) {
        const newName = prompt('Novo nome do quadro:', oldName.replace('.board', ''));
        if (!newName || !newName.trim()) return;

        const finalName = newName.trim().endsWith('.board') ? newName.trim() : `${newName.trim()}.board`;
        if (finalName === oldName) return;

        // Validar permissões e renomear
        // File System API não suporta rename direto fácil em todas as versões.
        // O padrão é move() se suportado ou copy+delete

        try {
            if (handle.move) {
                await handle.move(finalName);
                showToast('Quadro renomeado!');
                await window.refreshAllWorkspaces(); // Refresh UI
                this.render();
            } else {
                // Copy + Delete fallback
                const dirHandle = await this.getParentHandle(handle); // Hard to get parent from file handle directly without traversal
                if (!dirHandle) {
                    alert('Navegador não suporta renomear este arquivo (falta referência da pasta).');
                    return;
                }

                // Copy content
                const file = await handle.getFile();
                const content = await file.text();

                // Create new
                const newHandle = await dirHandle.getFileHandle(finalName, { create: true });
                await FSHandler.saveFile(newHandle, content);

                // Delete old
                await dirHandle.removeEntry(oldName);

                showToast('Quadro renomeado!');
                await window.refreshAllWorkspaces();
                this.render();
            }
        } catch (e) {
            console.error('Rename failed:', e);
            // Fallback simplistic: alert user
            alert('Erro ao renomear. Tente mover ou duplicar.');
        }
    },

    async duplicateBoard(handle, name) {
        try {
            const file = await handle.getFile();
            const content = await file.text();

            const newName = `Cópia de ${name}`;

            // Where to save? Same folder if possible.
            // We need parent handle.
            const dirHandle = await this.getParentHandle(handle);
            if (!dirHandle) {
                // Save in default location or prompt?
                // Let's prompt "Save As" effectively
                const newDir = await window.showDirectoryPicker({ id: 'cromva-boards', mode: 'readwrite' });
                const newHandle = await newDir.getFileHandle(newName, { create: true });
                await FSHandler.saveFile(newHandle, content);
            } else {
                const newHandle = await dirHandle.getFileHandle(newName, { create: true });
                await FSHandler.saveFile(newHandle, content);
            }

            showToast('Quadro duplicado!');
            await window.refreshAllWorkspaces();
            this.render();
        } catch (e) {
            console.error('Duplicate failed:', e);
            alert('Erro ao duplicar: ' + e.message);
        }
    },

    async confirmDeleteBoard(handle, name) {
        if (!confirm(`Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`)) return;

        try {
            const dirHandle = await this.getParentHandle(handle);
            if (dirHandle) {
                await dirHandle.removeEntry(name);
                showToast('Quadro excluído!');
                await window.refreshAllWorkspaces();
                this.render();
            } else {
                // If we persist handles, maybe we can delete via handle.remove() if available?
                if (handle.remove) { // Standard method?
                    await handle.remove();
                    showToast('Quadro excluído!');
                    await window.refreshAllWorkspaces();
                    this.render();
                } else {
                    alert('Não foi possível excluir (falta permissão ou pasta pai).');
                }
            }
        } catch (e) {
            console.error('Delete failed:', e);
            alert('Erro ao excluir: ' + e.message);
        }
    },

    async moveBoard(handle, name) {
        try {
            const destDir = await window.showDirectoryPicker({
                id: 'cromva-boards',
                mode: 'readwrite',
                startIn: 'documents'
            });

            if (!destDir) return;

            // Copy
            const file = await handle.getFile();
            const content = await file.text();

            const newHandle = await destDir.getFileHandle(name, { create: true });
            await FSHandler.saveFile(newHandle, content);

            // Delete Old
            const dirHandle = await this.getParentHandle(handle);
            if (dirHandle) {
                await dirHandle.removeEntry(name);
            } else if (handle.remove) {
                await handle.remove();
            }

            showToast(`Quadro movido para ${destDir.name}`);
            await window.refreshAllWorkspaces();
            this.render();

        } catch (e) {
            console.error('Move failed:', e);
            alert('Erro ao mover: ' + e.message);
        }
    },

    // Helper to find parent folder handle by traversal (expensive but necessary if `parent` property not standard)
    async getParentHandle(fileHandle) {
        // We check all workspace roots + default location
        // This is tricky. 
        // Iterate all active workspace handles

        const checkDir = async (dirHandle) => {
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file' && entry.name === fileHandle.name) {
                    // Start strict equality check on handles if possible? 
                    // Browser policies make handle equality check `await fileHandle.isSameEntry(entry)`
                    if (await fileHandle.isSameEntry(entry)) return dirHandle;
                } else if (entry.kind === 'directory') {
                    const found = await checkDir(entry);
                    if (found) return found;
                }
            }
            return null;
        };

        // 1. Check current workspace
        const wsId = window.currentWorkspaceId;
        if (wsId && FSHandler.handles[wsId]) {
            const found = await checkDir(FSHandler.handles[wsId]);
            if (found) return found;
        }

        // 2. Check Default Location
        try {
            const defHandle = await HandleStore.get('DEFAULT_BOARD_LOCATION');
            if (defHandle && (await HandleStore.checkPermission(defHandle))) {
                const found = await checkDir(defHandle);
                if (found) return found;
            }
        } catch (e) { }

        return null;
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
