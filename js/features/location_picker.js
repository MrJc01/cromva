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
        if (FSHandler.isSupported()) {
            const addEl = document.createElement('div');
            addEl.className = 'flex-shrink-0 px-3 py-2 rounded-lg border border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 cursor-pointer transition-all flex items-center gap-2';
            addEl.innerHTML = `<i data-lucide="folder-plus" class="w-3.5 h-3.5"></i> <span class="text-xs font-bold">Abrir Local</span>`;
            addEl.onclick = async () => {
                const newWs = await FSHandler.openDirectory();
                if (newWs) {
                    this.selectedWorkspaceId = newWs.id;
                    this.selectedFolderId = null;
                    if (renderWorkspaces) renderWorkspaces(); // Refresh main workspace list
                    this.renderWorkspaces(); // Refresh picker list
                    this.renderFolders(newWs.id);
                    showToast(`Pasta "${newWs.name}" adicionada!`);
                }
            };
            list.appendChild(addEl);
        }

        workspaces.forEach(ws => {
            const isSelected = ws.id === this.selectedWorkspaceId;
            const el = document.createElement('div');
            el.className = `flex-shrink-0 px-3 py-2 rounded-lg border cursor-pointer transition-all ${isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`;
            el.innerHTML = `<span class="text-xs font-bold">${ws.name}</span>${ws.isLocal ? ' <i data-lucide="hard-drive" class="w-3 h-3 inline ml-1 opacity-50"></i>' : ''}`;
            el.onclick = () => {
                this.selectedWorkspaceId = ws.id;
                this.selectedFolderId = null; // Reset folder on workspace switch
                this.renderWorkspaces();
                this.renderFolders(ws.id);
            };
            list.appendChild(el);
        });
        if (window.lucide) lucide.createIcons();
    },

    renderFolders(wsId) {
        const list = document.getElementById('lp-folder-list');
        list.innerHTML = '';

        const folders = (workspaceFiles[wsId] || []).filter(f => f.type === 'folder');

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

    confirm() {
        const ws = workspaces.find(w => w.id === this.selectedWorkspaceId);
        const folder = this.selectedFolderId
            ? (workspaceFiles[this.selectedWorkspaceId] || []).find(f => f.id === this.selectedFolderId)
            : { name: '/' };

        const label = document.getElementById('current-location-label');
        if (label) {
            label.innerText = `${ws.name} > ${folder.name}`;
            label.classList.remove('hidden');
        }

        showToast(`Local definido: ${ws.name}/${folder.name}`);

        // Update current note metadata if applicable (Global notes don't strictly have path yet directly mapped in this prototype, 
        // but we can attach it to the temporary object)
        if (currentNoteId) {
            const note = notes.find(n => n.id === currentNoteId);
            if (note) {
                note.location = { workspaceId: this.selectedWorkspaceId, folderId: this.selectedFolderId };
            }
        }

        if (this.onConfirm) this.onConfirm({ workspaceId: this.selectedWorkspaceId, folderId: this.selectedFolderId });
        this.close();
    }
};
