// --- FILE SYSTEM ACCESS HANDLER ---

const FSHandler = {
    // Map internal workspace ID -> FileSystemDirectoryHandle
    handles: {},

    isSupported() {
        return 'showDirectoryPicker' in window;
    },

    /**
     * Restaura handles do IndexedDB (chamado na inicialização)
     */
    async restoreHandles() {
        if (typeof HandleStore === 'undefined') {
            console.warn('[FSHandler] HandleStore not available');
            return;
        }

        try {
            const restored = await HandleStore.restoreAll();
            Object.assign(this.handles, restored);
            console.log(`[FSHandler] Restored ${Object.keys(restored).length} handles from IndexedDB`);
        } catch (e) {
            console.error('[FSHandler] Error restoring handles:', e);
        }
    },

    /**
     * Salva um handle no IndexedDB para persistência
     */
    async persistHandle(id, handle, type = 'directory') {
        if (typeof HandleStore !== 'undefined') {
            await HandleStore.save(id, handle, type);
        }
    },

    /**
     * Verifica permissão de leitura/escrita para um handle
     * @param {FileSystemHandle} handle - Handle do arquivo ou diretório
     * @param {string} mode - 'read' ou 'readwrite'
     * @returns {Promise<'granted'|'denied'|'prompt'>}
     */
    async checkPermission(handle, mode = 'readwrite') {
        if (!handle) return 'denied';

        try {
            const permission = await handle.queryPermission({ mode });
            return permission;
        } catch (e) {
            console.error('[FSHandler] Error checking permission:', e);
            return 'denied';
        }
    },

    /**
     * Solicita permissão para um handle
     * @param {FileSystemHandle} handle - Handle do arquivo ou diretório
     * @param {string} mode - 'read' ou 'readwrite'
     * @returns {Promise<boolean>} - true se permissão concedida
     */
    async requestPermission(handle, mode = 'readwrite') {
        if (!handle) return false;

        try {
            const permission = await handle.requestPermission({ mode });
            return permission === 'granted';
        } catch (e) {
            console.error('[FSHandler] Error requesting permission:', e);
            return false;
        }
    },

    /**
     * Verifica e solicita permissão para um workspace
     * @param {number} workspaceId - ID do workspace
     * @returns {Promise<boolean>} - true se tem permissão
     */
    async ensurePermission(workspaceId) {
        const handle = this.handles[workspaceId];
        if (!handle) {
            console.warn('[FSHandler] No handle for workspace:', workspaceId);
            return false;
        }

        const status = await this.checkPermission(handle);

        if (status === 'granted') {
            return true;
        }

        if (status === 'prompt') {
            // Mostrar UI para solicitar permissão
            const ok = await ConfirmModal.show({
                title: 'Permissão Necessária',
                message: 'O navegador precisa de permissão para acessar esta pasta. Deseja conceder acesso?',
                confirmText: 'Conceder',
                type: 'info'
            });

            if (ok) {
                const granted = await this.requestPermission(handle);
                if (granted) {
                    showToast('Permissão concedida!');
                    return true;
                } else {
                    showToast('Permissão negada');
                    return false;
                }
            }
        }

        showToast('Sem permissão para acessar a pasta');
        return false;
    },

    /**
     * Lista status de permissões de todos os handles
     */
    async listPermissions() {
        const statuses = {};

        for (const [id, handle] of Object.entries(this.handles)) {
            statuses[id] = {
                name: handle.name,
                permission: await this.checkPermission(handle)
            };
        }

        return statuses;
    },

    async openDirectory() {
        if (!this.isSupported()) {
            showToast('Seu navegador não suporta acesso a arquivos locais.');
            return null;
        }

        try {
            const handle = await window.showDirectoryPicker();
            if (handle) {
                return await addWorkspaceFromFolder(handle);
            }
            return null;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error selecting folder:', err);
                showToast('Erro ao abrir pasta local.');
            }
            return null;
        }
    },

    async readDirectory(dirHandle, parentPath = '') {
        const files = [];
        let idCounter = Date.now(); // Simple ID generation

        for await (const entry of dirHandle.values()) {
            // Generate unique ID
            const id = idCounter++;

            if (entry.kind === 'file') {
                // Filter for likely text/markdown files or allow all
                if (entry.name.endsWith('.md') || entry.name.endsWith('.txt') || entry.name.endsWith('.json') || entry.name.endsWith('.js') || entry.name.endsWith('.html') || entry.name.endsWith('.css') || entry.name.endsWith('.board')) {
                    files.push({
                        id: id,
                        name: entry.name,
                        type: 'file',
                        size: 'Local', // Can't easily get size without getFile() which is heavier
                        status: 'visible',
                        locked: false,
                        handle: entry, // Store handle for saving
                        path: parentPath + entry.name
                    });
                }
            } else if (entry.kind === 'directory') {
                // Directories should be marked as folders
                files.push({
                    id: id,
                    name: entry.name,
                    type: 'folder',
                    size: '-',
                    status: 'visible',
                    locked: false,
                    handle: entry,
                    path: parentPath + entry.name + '/'
                });
            }
        }
        return files;
    },

    async saveFile(fileHandle, content) {
        if (!fileHandle) return false;

        // Robustness: if it's a plain object (from localStorage), it won't have methods
        if (typeof fileHandle.createWritable !== 'function') {
            console.error('[FSHandler] Invalid handle for saving:', fileHandle);
            return false;
        }

        try {
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            console.log(`[FSHandler] File "${fileHandle.name}" saved.`);
            return true;
        } catch (err) {
            console.error('[FSHandler] Error saving file:', err);
            if (err.name === 'NotAllowedError') {
                showToast('Permissão de escrita negada pelo navegador.');
            } else {
                showToast('Erro ao salvar arquivo no disco.');
            }
            return false;
        }
    },

    async getFileHandle(wsId, fileName, create = false) {
        const dirHandle = this.handles[wsId];
        if (!dirHandle) {
            console.error('[FSHandler] Base directory handle not found for workspace:', wsId);
            return null;
        }

        try {
            return await dirHandle.getFileHandle(fileName, { create });
        } catch (err) {
            console.error(`[FSHandler] Error resolving file handle for ${fileName}:`, err);
            return null;
        }
    },

    async createNewFile(dirHandle, filename, content) {
        if (!dirHandle) return null;
        try {
            const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
            await this.saveFile(fileHandle, content);
            return fileHandle;
        } catch (err) {
            console.error('Error creating file:', err);
            return null;
        }
        return null;
    },
    async deleteEntry(parentHandle, name, isDirectory = false) {
        if (!parentHandle) return false;
        try {
            // Se for diretório, precisa de recursive: true
            await parentHandle.removeEntry(name, { recursive: isDirectory });
            return true;
        } catch (err) {
            console.error('Error deleting entry:', err);
            return false;
        }
    },
    // Alias para compatibilidade
    async deleteFile(parentHandle, name) {
        return this.deleteEntry(parentHandle, name, false);
    },

    async syncFilesToNotes(wsId) {
        const files = window.workspaceFiles[wsId] || [];
        console.log(`[Sync] Syncing files for workspace ${wsId}`);

        let addedCount = 0;

        // Helper recursive function
        const processFiles = async (fileList, parentFolderId = null) => {
            for (const file of fileList) {
                // If folder, recurse
                if (file.type === 'folder' && file.children && file.children.length > 0) {
                    await processFiles(file.children, file.id);
                    continue;
                }

                if (file.type !== 'file' || !file.name.endsWith('.md')) continue;

                // Check if already in notes (by handle check)
                const existing = window.notes.find(n => n.fileHandle && n.fileHandle.isSameEntry(file.handle));
                // Also check by filename/location
                const existingByName = window.notes.find(n => n.location && n.location.workspaceId === wsId && n.location.folderId === (parentFolderId || file.id));

                if (existing || existingByName) {
                    continue;
                }

                try {
                    const fileHandle = file.handle;
                    const fileObj = await fileHandle.getFile();
                    const content = await fileObj.text();

                    // Extract Title from filename or content
                    let title = file.name.replace('.md', '');
                    const match = content.match(/^# (.*)/);
                    if (match) title = match[1];

                    const newNote = {
                        id: file.id, // Use file ID to link easier
                        title: title,
                        content: content,
                        category: 'Local',
                        date: new Date(fileObj.lastModified).toISOString(),
                        location: {
                            workspaceId: wsId,
                            folderId: parentFolderId || (file.type === 'file' ? null : file.id) // If file is in root, folderId null. If in folder, parentFolderId.
                        },
                        fileHandle: fileHandle
                    };

                    // If it was a direct file in root (parentFolderId null), check if the file object itself is its own "folder" ID?
                    // No, file.id is the ID of the file entry.
                    // If file is inside a folder, folderId should be the folder's ID.
                    // If file is in root, folderId is null? Or we use file.id as before?
                    // The previous logic was: folderId: file.id. That implies file in root -> linked to itself?
                    // Let's keep logic: if parentFolderId defined (inside folder), use it. If root, use null or explicit?
                    // Previous code: location: { folderId: file.id } (for root files).
                    if (parentFolderId) {
                        newNote.location.folderId = parentFolderId;
                    } else {
                        // Standalone file in root
                        newNote.location.folderId = file.id;
                    }

                    window.notes.push(newNote);
                    addedCount++;
                } catch (err) {
                    console.error('Error reading file for sync:', file.name, err);
                }
            }
        };

        await processFiles(files);

        if (addedCount > 0) {
            console.log(`[Sync] Imported ${addedCount} notes from disk.`);
            if (typeof renderNotes === 'function') renderNotes();
            if (typeof saveData === 'function') saveData();
        }
    }
};

/**
 * Global function to add a workspace from a directory handle.
 * Called by LocationPicker and FSHandler.
 */
async function addWorkspaceFromFolder(handle) {
    // Check if it already exists (by name and having a registered handle)
    const existingIndex = window.workspaces.findIndex(ws => {
        return ws.name === handle.name && FSHandler.handles[ws.id];
    });

    if (existingIndex > -1) {
        // RE-CONNECT LOGIC
        const existing = window.workspaces[existingIndex];
        const id = existing.id;

        console.log('[FSHandler] Workspace exists, refreshing connection...', id);

        // Update handle map (crucial for recovered sessions)
        FSHandler.handles[id] = handle;

        // Persist updated handle to IndexedDB
        FSHandler.persistHandle(id, handle, 'directory');

        // Refresh files structure
        try {
            const files = await FSHandler.readDirectory(handle);
            workspaceFiles[id] = files;

            // Sync files to notes
            await FSHandler.syncFilesToNotes(id);

            if (typeof saveData === 'function') saveData();

            showToast(`Workspace "${handle.name}" reconectado!`);

            // Trigger UI updates
            if (typeof renderWorkspaces === 'function') renderWorkspaces();
            if (typeof renderExplorer === 'function') renderExplorer(id);

            return existing;
        } catch (err) {
            console.error('Error refreshing directory:', err);
            showToast('Erro ao atualizar arquivos.');
            return existing;
        }
    }

    // NEW WORKSPACE LOGIC
    const id = Date.now();
    FSHandler.handles[id] = handle;

    // Persist handle to IndexedDB
    FSHandler.persistHandle(id, handle, 'directory');

    // Create Workspace Entry (no isLocal - workspace is hybrid)
    const workspace = {
        id: id,
        name: handle.name,
        desc: 'Pasta Local',
        color: 'amber',
        date: new Date().toISOString()
    };

    // Register in global state immediately
    window.workspaces.push(workspace);
    window.workspaceFiles[id] = [];
    if (typeof saveData === 'function') saveData();

    // Read structure
    try {
        const files = await FSHandler.readDirectory(handle);
        window.workspaceFiles[id] = files;

        // Sync files to notes
        await FSHandler.syncFilesToNotes(id);

        if (typeof saveData === 'function') saveData();
        showToast(`Workspace "${handle.name}" adicionado com sucesso!`);
    } catch (err) {
        console.error('Error reading directory:', err);
        showToast('Erro ao ler arquivos da pasta.');
    }

    // Trigger UI updates if available
    if (typeof renderWorkspaces === 'function') renderWorkspaces();
    if (typeof renderExplorer === 'function') renderExplorer(id);

    return workspace;
}
