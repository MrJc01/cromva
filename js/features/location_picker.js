const LocationPicker = {
    selectedWorkspaceId: null,
    selectedFolderId: null,
    onConfirm: null,

    init() {
        // Any init logic
    },

    open(callback) {
        this.selectedWorkspaceId = currentWorkspaceId; // Default to current
        this.selectedFolderId = null;
        this.onConfirm = callback; // Optional callback

        document.getElementById('location-picker-modal').classList.remove('hidden');
        document.getElementById('location-picker-modal').classList.add('flex');

        this.renderWorkspaces();
        this.renderFolders(this.selectedWorkspaceId);
    },

    close() {
        document.getElementById('location-picker-modal').classList.add('hidden');
        document.getElementById('location-picker-modal').classList.remove('flex');
    },

    renderWorkspaces() {
        const list = document.getElementById('lp-workspace-list');
        list.innerHTML = '';

        // "Add Local" Button
        if (typeof FSHandler !== 'undefined' && FSHandler.isSupported()) {
            const addEl = document.createElement('div');
            addEl.className = 'flex-shrink-0 px-3 py-2 mb-4 rounded-lg border border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800 cursor-pointer transition-all flex items-center justify-center gap-2 group';
            addEl.innerHTML = `<i data-lucide="folder-plus" class="w-4 h-4 group-hover:scale-110 transition-transform"></i> <span class="text-sm font-medium">Conectar Pasta Local</span>`;
            addEl.onclick = async () => {
                try {
                    const handle = await window.showDirectoryPicker();
                    if (handle) {
                        const newWs = await addWorkspaceFromFolder(handle);
                        this.selectedWorkspaceId = newWs.id; // Auto-select the newly added workspace
                        this.selectedFolderId = null;

                        // Refresh both Manager and Picker UI
                        if (typeof renderWorkspaces === 'function') renderWorkspaces();
                        this.renderWorkspaces();
                        this.renderFolders(newWs.id);

                        showToast(`Pasta "${newWs.name}" conectada e selecionada!`);
                    }
                } catch (e) {
                    if (e.name !== 'AbortError') {
                        console.error('[LocationPicker] Error connecting folder:', e);
                        showToast('Erro ao conectar pasta.');
                    }
                }
            };
            list.appendChild(addEl);
        }

        // Helper to render a generic workspace item
        const renderItem = (ws) => {
            const isSelected = ws.id === this.selectedWorkspaceId;
            const hasLinkedFolders = (window.workspaceFiles[ws.id] || []).some(f => f.handle || f.source === 'filesystem');
            const hasHandle = FSHandler.handles[ws.id] !== undefined;

            const el = document.createElement('div');
            el.className = `flex-shrink-0 px-3 py-2 mb-2 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 ${isSelected
                ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-sm shadow-blue-900/20'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800/50'
                }`;

            // Icon based on content type
            const iconName = hasHandle || hasLinkedFolders ? 'folder-tree' : 'database';
            const typeLabel = hasHandle || hasLinkedFolders ? 'DISCO' : 'MEMÓRIA';
            const typeColor = hasHandle || hasLinkedFolders ? 'text-emerald-500' : 'text-blue-500';

            el.innerHTML = `
                <div class="flex items-center gap-2">
                    <i data-lucide="${iconName}" class="w-4 h-4 ${isSelected ? 'text-blue-300' : 'text-zinc-500'}"></i>
                    <span class="text-sm font-semibold truncate flex-1">${ws.name}</span>
                    ${isSelected ? '<i data-lucide="check" class="w-3 h-3 text-blue-400"></i>' : ''}
                </div>
                <div class="flex items-center justify-between mt-1">
                    <span class="text-[10px] uppercase font-bold tracking-wider ${typeColor}">${typeLabel}</span>
                    <span class="text-[10px] text-zinc-600">${new Date(ws.date).toLocaleDateString()}</span>
                </div>
            `;

            el.onclick = () => {
                this.selectedWorkspaceId = ws.id;
                this.selectedFolderId = null;
                this.renderWorkspaces();
                this.renderFolders(ws.id);
            };
            list.appendChild(el);
        };

        // Render all workspaces
        workspaces.forEach(ws => renderItem(ws));

        if (window.lucide) lucide.createIcons();
    },

    renderFolders(wsId) {
        const list = document.getElementById('lp-folder-list');
        list.innerHTML = '';

        const folders = (window.workspaceFiles[wsId] || []).filter(f => f.type === 'folder');

        // Root option
        const rootEl = document.createElement('div');
        rootEl.className = `p-2 rounded border cursor-pointer flex items-center gap-2 transition-all ${this.selectedFolderId === null
            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
            : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
            }`;
        rootEl.innerHTML = `<i data-lucide="home" class="w-3.5 h-3.5"></i> <span class="text-xs">Raiz (/)</span>`;
        rootEl.onclick = () => {
            this.selectedFolderId = null;
            this.renderFolders(wsId);
        };
        list.appendChild(rootEl);

        // "Add New Folder" Button
        if (typeof FSHandler !== 'undefined' && FSHandler.isSupported()) {
            const addEl = document.createElement('div');
            addEl.className = 'p-2 rounded border border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-zinc-800 cursor-pointer transition-all flex items-center gap-2 group';
            addEl.innerHTML = `<i data-lucide="folder-plus" class="w-3.5 h-3.5 group-hover:scale-110 transition-transform"></i> <span class="text-xs">Adicionar Pasta</span>`;
            addEl.onclick = async () => {
                try {
                    const handle = await window.showDirectoryPicker();
                    if (handle) {
                        await this.addFolderToCurrentWorkspace(wsId, handle);
                        this.renderFolders(wsId);
                        showToast(`Pasta "${handle.name}" adicionada ao workspace!`);
                    }
                } catch (e) {
                    if (e.name !== 'AbortError') {
                        console.error('[LocationPicker] Error adding folder:', e);
                        showToast('Erro ao adicionar pasta.');
                    }
                }
            };
            list.appendChild(addEl);
        }

        folders.forEach(f => {
            const isSelected = this.selectedFolderId === f.id;
            const el = document.createElement('div');
            el.className = `p-2 rounded border cursor-pointer flex items-center gap-2 transition-all ${isSelected
                ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                }`;
            el.innerHTML = `<i data-lucide="folder" class="w-3.5 h-3.5 ${f.locked ? 'text-amber-500' : ''}"></i> <span class="text-xs truncate">${f.name}</span>`;
            el.onclick = () => {
                if (f.locked) {
                    showToast('Pasta trancada (simulação)');
                }
                this.selectedFolderId = f.id;
                this.renderFolders(wsId);
            };
            list.appendChild(el);
        });

        if (window.lucide) lucide.createIcons();
    },

    async addFolderToCurrentWorkspace(wsId, handle) {
        // Check if folder already exists
        const existingFolder = (window.workspaceFiles[wsId] || []).find(f => f.name === handle.name && f.type === 'folder');
        if (existingFolder) {
            // Update handle if lost
            existingFolder.handle = handle;
            showToast(`Pasta "${handle.name}" já existe, handle atualizado.`);
            return existingFolder;
        }

        const newFolder = {
            id: Date.now(),
            name: handle.name,
            type: 'folder',
            size: '-',
            status: 'visible',
            locked: false,
            handle: handle,
            isMount: true
        };

        if (!window.workspaceFiles[wsId]) {
            window.workspaceFiles[wsId] = [];
        }
        window.workspaceFiles[wsId].push(newFolder);
        saveData();

        // Always register handle in FSHandler for this folder
        FSHandler.handles[`${wsId}_${newFolder.id}`] = handle;

        return newFolder;
    },

    async confirm() {
        const ws = window.workspaces.find(w => w.id === this.selectedWorkspaceId);
        const folder = this.selectedFolderId
            ? (window.workspaceFiles[this.selectedWorkspaceId] || []).find(f => f.id === this.selectedFolderId)
            : { name: '/' };

        if (!ws) {
            showToast('Workspace não encontrado.');
            return;
        }

        const label = document.getElementById('current-location-label');
        if (label) {
            label.innerText = `${ws.name} > ${folder.name}`;
            label.classList.remove('hidden');
        }

        // Update current note metadata
        if (currentNoteId) {
            const note = notes.find(n => n.id === currentNoteId);
            if (note) {
                note.location = { workspaceId: this.selectedWorkspaceId, folderId: this.selectedFolderId };

                // Check if we have a handle to save to disk
                // Priority: folder handle > workspace baseDirHandle
                let targetHandle = null;
                let targetType = null;

                if (this.selectedFolderId && folder && folder.handle) {
                    // Saving inside a specific folder with handle
                    targetHandle = folder.handle;
                    targetType = 'folder';
                } else if (FSHandler.handles[this.selectedWorkspaceId]) {
                    // Workspace has a base directory handle
                    targetHandle = FSHandler.handles[this.selectedWorkspaceId];
                    targetType = 'workspace';
                }

                console.log('[LocationPicker] Selected workspace:', ws);
                console.log('[LocationPicker] Target handle:', targetHandle);
                console.log('[LocationPicker] Target type:', targetType);

                // If we have a handle, save to disk
                if (targetHandle) {
                    try {
                        // Generate filename from note title
                        const filename = (note.title || 'Sem título').replace(/[^a-zA-Z0-9À-ÿ\s-_]/g, '') + '.md';
                        console.log('[LocationPicker] Creating file:', filename);

                        // Check if file already exists in workspaceFiles
                        const existingFile = workspaceFiles[this.selectedWorkspaceId]?.find(f => f.name === filename);

                        if (existingFile && existingFile.handle) {
                            // Update existing file
                            console.log('[LocationPicker] File exists, updating...');
                            await FSHandler.saveFile(existingFile.handle, note.content);
                            note.fileHandle = existingFile.handle;
                            showToast(`Arquivo "${filename}" atualizado no disco!`);
                        } else {
                            // Create new file
                            console.log('[LocationPicker] Creating new file...');
                            const fileHandle = await FSHandler.createNewFile(targetHandle, filename, note.content);

                            if (fileHandle) {
                                // Store the handle in the note
                                note.fileHandle = fileHandle;

                                // Add to workspaceFiles
                                const newFile = {
                                    id: note.id,
                                    name: filename,
                                    type: 'file',
                                    size: 'Local',
                                    status: 'visible',
                                    locked: false,
                                    handle: fileHandle,
                                    path: filename,
                                    source: 'filesystem'  // Mark as filesystem source
                                };

                                if (!workspaceFiles[this.selectedWorkspaceId]) {
                                    workspaceFiles[this.selectedWorkspaceId] = [];
                                }
                                workspaceFiles[this.selectedWorkspaceId].push(newFile);
                                console.log('[LocationPicker] File added to workspaceFiles');

                                showToast(`Arquivo "${filename}" criado no disco!`);
                            } else {
                                console.error('[LocationPicker] createNewFile returned null');
                                showToast('Não foi possível criar o arquivo.');
                            }
                        }
                    } catch (e) {
                        console.error('[LocationPicker] Error saving to disk:', e);
                        showToast('Erro ao salvar no disco: ' + e.message);
                    }
                } else {
                    console.log('[LocationPicker] No handle (virtual storage), just updating location');
                    showToast(`Local definido: ${ws.name}`);
                }

                saveData();
            }
        }

        if (this.onConfirm) this.onConfirm({ workspaceId: this.selectedWorkspaceId, folderId: this.selectedFolderId });
        this.close();
    }

};
