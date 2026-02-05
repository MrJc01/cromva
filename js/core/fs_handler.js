// --- FILE SYSTEM ACCESS HANDLER ---

const FSHandler = {
    // Map internal workspace ID -> FileSystemDirectoryHandle
    handles: {},

    isSupported() {
        return 'showDirectoryPicker' in window;
    },

    async openDirectory() {
        if (!this.isSupported()) {
            showToast('Seu navegador não suporta acesso a arquivos locais.');
            return null;
        }

        try {
            const handle = await window.showDirectoryPicker();
            const id = Date.now();

            this.handles[id] = handle;

            // Read structure
            const files = await this.readDirectory(handle);

            // Create Workspace Entry
            const workspace = {
                id: id,
                name: handle.name,
                desc: 'Pasta Local',
                color: 'amber',
                date: new Date().toISOString(),
                isLocal: true
            };

            // Register in global state
            workspaces.push(workspace);
            workspaceFiles[id] = files;

            return workspace;
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
                if (entry.name.endsWith('.md') || entry.name.endsWith('.txt') || entry.name.endsWith('.json') || entry.name.endsWith('.js') || entry.name.endsWith('.html') || entry.name.endsWith('.css')) {
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
                // Shallow read or recursive? For now shallow + manual recursion later could be better for perf,
                // but let's do 1 level deep or just mark as folder.
                // For this prototype, we'll just list the folder itself.
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

                // TODO: Recursive read if we want deep tree
            }
        }
        return files;
    },

    async saveFile(fileHandle, content) {
        if (!fileHandle) return false;
        try {
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            return true;
        } catch (err) {
            console.error('Error saving file:', err);
            showToast('Erro ao salvar arquivo no disco.');
            return false;
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
    async deleteFile(parentHandle, name) {
        if (!parentHandle) return false;
        try {
            await parentHandle.removeEntry(name);
            return true;
        } catch (err) {
            console.error('Error deleting file:', err);
            return false;
        }
    }
};
