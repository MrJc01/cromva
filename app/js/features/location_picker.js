const LocationPicker = {
    selectedWorkspaceId: null,
    selectedFolderId: null,
    onConfirm: null,

    init() {
        // Any init logic
    },

    open(callback) {
        // Check current note location to pre-select
        const currentNote = window.notes?.find(n => n.id === window.currentNoteId);

        if (currentNote?.location) {
            this.selectedWorkspaceId = currentNote.location.workspaceId || window.currentWorkspaceId;

            // Pre-select folder - need to find the correct folder ID
            const wsFiles = window.workspaceFiles[this.selectedWorkspaceId] || [];
            const folderId = currentNote.location.folderId;

            // If folderId exists, check if it's a folder or a file inside a folder
            if (folderId) {
                const directFolder = wsFiles.find(f => f.id === folderId && f.type === 'folder');
                if (directFolder) {
                    this.selectedFolderId = folderId;
                } else {
                    // Maybe it's a file ID - find the parent folder
                    const parentFolder = wsFiles.find(f =>
                        f.type === 'folder' &&
                        f.children?.some(c => c.id === folderId)
                    );
                    this.selectedFolderId = parentFolder ? parentFolder.id : null;
                }
            } else {
                this.selectedFolderId = null;
            }
        } else {
            this.selectedWorkspaceId = window.currentWorkspaceId;
            this.selectedFolderId = null;
        }

        this.onConfirm = callback;

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

        // Removed "Add Local" button - workspace creation should be done in Workspace Manager
        // The Location Picker is only for selecting WHERE to save, not creating workspaces

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

        // "Select Folder" Button - opens system picker and goes directly to move/copy
        if (typeof FSHandler !== 'undefined' && FSHandler.isSupported()) {
            const selectEl = document.createElement('div');
            selectEl.className = 'p-2 rounded border border-dashed border-blue-700 text-blue-400 hover:text-blue-300 hover:border-blue-500 hover:bg-blue-900/20 cursor-pointer transition-all flex items-center gap-2 group';
            selectEl.innerHTML = `<i data-lucide="folder-open" class="w-3.5 h-3.5 group-hover:scale-110 transition-transform"></i> <span class="text-xs font-medium">Selecionar Pasta...</span>`;
            selectEl.onclick = async () => {
                try {
                    const handle = await window.showDirectoryPicker();
                    if (handle) {
                        // Store the handle temporarily for direct save
                        this.tempDirectHandle = handle;
                        this.selectedFolderId = 'temp_direct'; // Special marker

                        // Close location picker and show move/copy modal directly
                        const note = window.notes?.find(n => n.id === window.currentNoteId);
                        const ws = window.workspaces.find(w => w.id === this.selectedWorkspaceId);

                        // Store pending change info
                        this.pendingLocation = {
                            workspaceId: this.selectedWorkspaceId,
                            folderId: null,
                            folder: { name: handle.name, handle: handle },
                            directHandle: handle  // Direct handle for saving
                        };
                        this.originalLocation = note?.location ? {
                            workspaceId: note.location.workspaceId,
                            folderId: note.location.folderId
                        } : null;

                        const oldWs = window.workspaces.find(w => w.id === note?.location?.workspaceId);
                        const fromLabel = oldWs ? `${oldWs.name}` : 'Sem local definido';
                        const toLabel = `${handle.name} (pasta externa)`;

                        document.getElementById('mc-from').textContent = fromLabel;
                        document.getElementById('mc-to').textContent = toLabel;

                        // Close this modal and show move/copy
                        this.close();
                        document.getElementById('move-copy-modal').classList.remove('hidden');
                        document.getElementById('move-copy-modal').classList.add('flex');
                        if (window.lucide) lucide.createIcons();
                    }
                } catch (e) {
                    if (e.name !== 'AbortError') {
                        console.error('[LocationPicker] Error selecting folder:', e);
                        showToast('Erro ao selecionar pasta.');
                    }
                }
            };
            list.appendChild(selectEl);
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

    // Store pending location change info
    pendingLocation: null,
    originalLocation: null,

    async confirm() {
        const ws = window.workspaces.find(w => w.id === this.selectedWorkspaceId);
        const folder = this.selectedFolderId
            ? (window.workspaceFiles[this.selectedWorkspaceId] || []).find(f => f.id === this.selectedFolderId)
            : null;

        if (!ws) {
            showToast('Workspace não encontrado.');
            return;
        }

        // Get current note
        const note = window.notes.find(n => n.id === window.currentNoteId);
        if (!note) {
            showToast('Nota não encontrada.');
            return;
        }

        // Check if location actually changed
        const oldWsId = note.location?.workspaceId;
        const oldFolderId = note.location?.folderId;
        const newWsId = this.selectedWorkspaceId;
        const newFolderId = this.selectedFolderId;

        const locationChanged = oldWsId !== newWsId || oldFolderId !== newFolderId;

        if (!locationChanged) {
            showToast('Localização não alterada.');
            this.close();
            return;
        }

        // Debug logs
        console.log('[LocationPicker] confirm() - folder:', folder);
        console.log('[LocationPicker] confirm() - folder.handle:', folder?.handle);
        console.log('[LocationPicker] confirm() - folder.handle.kind:', folder?.handle?.kind);

        // Store pending change info - include folder handle if it exists
        this.pendingLocation = {
            workspaceId: newWsId,
            folderId: newFolderId,
            folder,
            // Pass folder handle directly if available
            directHandle: folder?.handle?.kind === 'directory' ? folder.handle : null
        };
        this.originalLocation = { workspaceId: oldWsId, folderId: oldFolderId };

        // Build location labels for the modal
        const oldWs = window.workspaces.find(w => w.id === oldWsId);
        const oldFolder = oldFolderId
            ? (window.workspaceFiles[oldWsId] || []).find(f => f.id === oldFolderId)
            : null;

        const fromLabel = oldWs ? `${oldWs.name} > ${oldFolder?.name || '/'}` : 'Sem local definido';
        const toLabel = `${ws.name} > ${folder?.name || '/'}`;

        document.getElementById('mc-from').textContent = fromLabel;
        document.getElementById('mc-to').textContent = toLabel;

        // Close location picker and show move/copy modal
        this.close();
        document.getElementById('move-copy-modal').classList.remove('hidden');
        document.getElementById('move-copy-modal').classList.add('flex');
        if (window.lucide) lucide.createIcons();
    },

    closeMoveModal() {
        document.getElementById('move-copy-modal').classList.add('hidden');
        document.getElementById('move-copy-modal').classList.remove('flex');
        this.pendingLocation = null;
        this.originalLocation = null;
    },

    async executeMove() {
        await this._applyLocationChange(true);
    },

    async executeCopy() {
        await this._applyLocationChange(false);
    },

    async _applyLocationChange(deleteFromOld) {
        const originalNote = window.notes.find(n => n.id === window.currentNoteId);
        if (!originalNote || !this.pendingLocation) return;

        const { workspaceId, folderId, folder, directHandle } = this.pendingLocation;
        const ws = window.workspaces.find(w => w.id === workspaceId);

        // For COPY: create a new note with new ID
        // For MOVE: update the existing note
        let note;
        if (deleteFromOld) {
            // MOVE: update original note
            note = originalNote;
        } else {
            // COPY: create a duplicate note with new ID
            note = {
                ...originalNote,
                id: Date.now(),
                date: new Date().toISOString(),
                title: originalNote.title, // Keep same title
                content: originalNote.content
            };
            // Add to notes array
            window.notes.push(note);
        }

        // Determine target directory handle
        let targetDirHandle = null;
        if (directHandle?.kind === 'directory') {
            targetDirHandle = directHandle;
        } else if (folder?.handle?.kind === 'directory') {
            targetDirHandle = folder.handle;
        } else if (folderId) {
            const wsFiles = window.workspaceFiles[workspaceId] || [];
            const targetFolder = wsFiles.find(f => f.id === folderId && f.type === 'folder');
            if (targetFolder?.handle?.kind === 'directory') {
                targetDirHandle = targetFolder.handle;
            }
        } else if (FSHandler.handles[workspaceId]?.kind === 'directory') {
            targetDirHandle = FSHandler.handles[workspaceId];
        }

        // If directHandle (external folder), we update location to root of workspace (or special status)
        // and force the file to be added to workspaceFiles as a single file
        if (directHandle) {
            // Location effective is workspace root for now, but fileHandle points to external
            note.location = { workspaceId: workspaceId, folderId: null };
        } else {
            // Internal workspace move
            note.location = { workspaceId, folderId };
        }

        // Update UI Label
        const label = document.getElementById('current-location-label');
        if (label) {
            if (directHandle) {
                label.innerText = `${folder?.name || 'Externo'} (Arquivo)`;
            } else {
                label.innerText = `${ws?.name || ''} > ${folder?.name || '/'}`;
            }
        }

        // Save to filesystem
        let newFileHandle = null;
        if (targetDirHandle) {
            try {
                const filename = (note.title || 'Sem título').replace(/[^a-zA-Z0-9À-ÿ\s-_]/g, '') + '.md';
                console.log('[LocationPicker] Saving to filesystem:', filename, targetDirHandle);

                newFileHandle = await FSHandler.createNewFile(targetDirHandle, filename, note.content);
                if (newFileHandle) {
                    note.fileHandle = newFileHandle;
                    showToast(deleteFromOld ? `Arquivo movido!` : `Arquivo copiado!`);
                }
            } catch (e) {
                console.error('[LocationPicker] Error saving:', e);
                showToast('Erro ao salvar: ' + e.message);
                return; // Stop if save failed
            }
        } else {
            showToast(deleteFromOld ? 'Arquivo movido (virtual).' : 'Arquivo copiado (virtual).');
        }

        // Handle Workspace Files Reference (Update Memory)
        const filename = (note.title || 'Sem título').replace(/[^a-zA-Z0-9À-ÿ\s-_]/g, '') + '.md';

        // 1. External Folder (Direct Handle) or Root Addition
        if (directHandle && newFileHandle) {
            if (!window.workspaceFiles[workspaceId]) window.workspaceFiles[workspaceId] = [];

            const newFileEntry = {
                id: note.id,
                name: filename,
                type: 'file',
                size: 'Externo', // Marker
                status: 'visible',
                locked: false,
                handle: newFileHandle,
                path: filename,
                source: 'filesystem'
            };

            // Check if already exists to avoid duplicates
            const existingIdx = window.workspaceFiles[workspaceId].findIndex(f => f.id == note.id);
            if (existingIdx >= 0) {
                window.workspaceFiles[workspaceId][existingIdx] = newFileEntry;
            } else {
                window.workspaceFiles[workspaceId].push(newFileEntry);
            }
            console.log('[LocationPicker] Added external file reference to workspace');
        }
        // 2. Internal Folder Move
        else if (folderId && newFileHandle) {
            const wsFiles = window.workspaceFiles[workspaceId] || [];
            // Find target folder (loose equality for ID)
            const targetFolder = wsFiles.find(f => f.id == folderId && f.type === 'folder');

            if (targetFolder) {
                if (!targetFolder.children) targetFolder.children = [];

                const newFileEntry = {
                    id: note.id,
                    name: filename,
                    type: 'file',
                    size: 'Arquivo', // Placeholder
                    status: 'visible',
                    locked: false,
                    handle: newFileHandle,
                    lastModified: Date.now()
                };

                // Remove if exists (to update)
                const existingIdx = targetFolder.children.findIndex(f => f.id == note.id);
                if (existingIdx >= 0) {
                    targetFolder.children[existingIdx] = newFileEntry;
                } else {
                    targetFolder.children.push(newFileEntry);
                }
                console.log('[LocationPicker] Added file to internal folder:', targetFolder.name);
            }
        }
        // 3. Move to Root (Internal)
        else if (!folderId && !directHandle && newFileHandle && workspaceId) {
            const wsFiles = window.workspaceFiles[workspaceId] || [];
            const newFileEntry = {
                id: note.id,
                name: filename,
                type: 'file',
                size: 'Arquivo',
                status: 'visible',
                locked: false,
                handle: newFileHandle
            };
            // Check if already exists
            const existingIdx = wsFiles.findIndex(f => f.id == note.id);
            if (existingIdx >= 0) {
                wsFiles[existingIdx] = newFileEntry;
            } else {
                wsFiles.push(newFileEntry);
            }
        }

        // OLD LOCATION CLEANUP (Only if moving)
        if (deleteFromOld && this.originalLocation) {
            try {
                // Check if valid old handle exists
                const oldWsFiles = window.workspaceFiles[this.originalLocation.workspaceId] || [];
                let oldDirHandle = null;

                if (this.originalLocation.folderId) {
                    const oldFolder = oldWsFiles.find(f => f.id === this.originalLocation.folderId && f.type === 'folder');
                    oldDirHandle = oldFolder?.handle;
                }
                if (!oldDirHandle) {
                    oldDirHandle = FSHandler.handles[this.originalLocation.workspaceId];
                }

                if (oldDirHandle && oldDirHandle.kind === 'directory') {
                    const oldFilename = (originalNote.title || 'Sem título').replace(/[^a-zA-Z0-9À-ÿ\s-_]/g, '') + '.md';
                    await oldDirHandle.removeEntry(oldFilename);
                    console.log('[LocationPicker] Deleted old file:', oldFilename);
                }

                // Also remove reference from old workspaceFiles if it was there
                // oldWsFiles is already declared above (line ~433)
                if (oldWsFiles) {
                    if (this.originalLocation.folderId) {
                        // Remove from folder children
                        const oldFolder = oldWsFiles.find(f => f.id == this.originalLocation.folderId && f.type === 'folder');
                        if (oldFolder && oldFolder.children) {
                            const oldChildIdx = oldFolder.children.findIndex(f => f.id == originalNote.id);
                            if (oldChildIdx >= 0) {
                                oldFolder.children.splice(oldChildIdx, 1);
                                console.log('[LocationPicker] Removed old entry from folder children');
                            }
                        }
                    } else {
                        // Remove from root
                        const oldFileIdx = oldWsFiles.findIndex(f => f.id == originalNote.id && f.type === 'file');
                        if (oldFileIdx >= 0) {
                            oldWsFiles.splice(oldFileIdx, 1);
                            console.log('[LocationPicker] Removed old entry from root');
                        }
                    }
                }

            } catch (e) {
                console.warn('[LocationPicker] Cleanup error (minor):', e);
            }
        }

        saveData();
        renderNotes();
        // Force workspace refresh to show new external file
        if (typeof renderWorkspaces === 'function') renderWorkspaces();
        // If we are in the workspace we moved to, refresh explorer
        if (window.currentWorkspaceId === workspaceId && typeof renderExplorer === 'function') {
            renderExplorer(workspaceId);
        }

        this.closeMoveModal();

        if (this.onConfirm) this.onConfirm({ workspaceId, folderId });
    }

};
