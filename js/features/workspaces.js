// --- WORKSPACE MANAGER ENGINE ---

let pendingDeleteWsId = null;
let pendingDeleteFileId = null;

function openWorkspaceManager() {
    document.getElementById('workspace-modal').classList.remove('hidden');
    document.getElementById('workspace-modal').classList.add('flex');
    renderWorkspaces();
    renderExplorer(currentWorkspaceId);
}

function closeWorkspaceManager() {
    document.getElementById('workspace-modal').classList.add('hidden');
    document.getElementById('workspace-modal').classList.remove('flex');
}

function createNewWorkspace() {
    document.getElementById('new-workspace-modal').classList.remove('hidden');
    document.getElementById('new-workspace-modal').classList.add('flex');
    const input = document.getElementById('new-workspace-name');
    input.value = '';
    setTimeout(() => input.focus(), 100);

    input.onkeydown = (e) => {
        if (e.key === 'Enter') submitNewWorkspace();
        if (e.key === 'Escape') {
            document.getElementById('new-workspace-modal').classList.add('hidden');
            document.getElementById('new-workspace-modal').classList.remove('flex');
        }
    };
}

function submitNewWorkspace() {
    const input = document.getElementById('new-workspace-name');
    const name = input.value.trim();

    if (!name) {
        showToast('O nome do workspace não pode estar vazio');
        return;
    }

    const newId = Date.now();
    workspaces.push({
        id: newId,
        name: name,
        desc: 'Novo workspace criado',
        color: ['blue', 'emerald', 'amber', 'purple'][Math.floor(Math.random() * 4)],
        date: new Date().toISOString()
    });
    workspaceFiles[newId] = [];

    // Auto-selecionar o novo workspace
    currentWorkspaceId = newId;
    console.log('[Workspace] Created and selected workspace:', newId, name);

    saveData();
    renderWorkspaces();
    renderExplorer(newId);
    showToast(`Workspace "${name}" criado e selecionado!`);

    document.getElementById('new-workspace-modal').classList.add('hidden');
    document.getElementById('new-workspace-modal').classList.remove('flex');
}

function renderWorkspaces() {
    const list = document.getElementById('workspace-list');
    if (!list) return;
    list.innerHTML = '';

    const colorMap = {
        'blue': { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500', px: 'bg-blue-500' },
        'emerald': { border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-500', px: 'bg-emerald-500' },
        'amber': { border: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-500', px: 'bg-amber-500' },
        'purple': { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-500', px: 'bg-purple-500' }
    };

    workspaces.forEach(ws => {
        const isSelected = ws.id === currentWorkspaceId;
        const colors = colorMap[ws.color] || colorMap['blue'];

        const card = document.createElement('div');
        let borderClass = isSelected ? colors.border : 'border-zinc-800';
        let bgClass = isSelected ? colors.bg : 'bg-zinc-900/50';

        card.className = `min-w-[280px] h-full ${bgClass} border ${borderClass} rounded-xl p-5 flex flex-col justify-between cursor-pointer hover:border-zinc-600 transition-all group relative overflow-hidden`;
        card.onclick = () => switchWorkspace(ws.id);

        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-2">
                    <div class="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center ${colors.text} shadow-inner">
                        <i data-lucide="box" class="w-5 h-5"></i>
                    </div>
                    ${isSelected ? `<span class="${colors.px} text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Ativo</span>` : ''}
                </div>
                <h3 class="font-bold text-zinc-100 text-lg">${ws.name}</h3>
                <p class="text-xs text-zinc-500 mt-1">${ws.desc}</p>
            </div>
            <div class="flex items-center gap-2 text-[10px] text-zinc-600 font-mono mt-4">
                <i data-lucide="clock" class="w-3 h-3"></i>
                <span>${new Date(ws.date).toLocaleDateString()}</span>
            </div>
            ${isSelected ? '' : `<div class="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center backdrop-blur-[1px] transition-all"><span class="bg-zinc-100 text-zinc-950 px-3 py-1 rounded-full text-xs font-bold shadow-xl">Selecionar</span></div>`}
        `;
        list.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}

function switchWorkspace(id) {
    currentWorkspaceId = id;
    // Persist
    saveData();
    renderExplorer(id);
    renderWorkspaces();
    showToast(`Workspace alterado para ${workspaces.find(w => w.id === id).name}`);
}

function renderExplorer(wsId) {
    const workspace = workspaces.find(w => w.id === wsId);
    if (!workspace) return;

    document.getElementById('current-workspace-name').innerText = workspace.name;
    document.getElementById('current-workspace-path').innerText = `/${workspace.name.toLowerCase().replace(/\s/g, '-')}`;

    const list = document.getElementById('explorer-list');
    list.innerHTML = '';

    const files = workspaceFiles[wsId] || [];

    if (files.length === 0) {
        list.innerHTML = `<div class="flex flex-col items-center justify-center h-40 text-zinc-600">
            <i data-lucide="folder-open" class="w-10 h-10 mb-2 opacity-20"></i>
            <p class="text-xs">Este workspace está vazio</p>
        </div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    files.forEach(file => {
        const row = document.createElement('div');
        row.className = `grid grid-cols-12 px-4 py-3 border-b border-zinc-800/30 hover:bg-zinc-900/50 items-center text-xs group transition-colors ${file.status === 'hidden' ? 'opacity-50 grayscale' : ''}`;

        let icon = file.type === 'folder' ? 'folder' : 'file';
        let iconColor = file.type === 'folder' ? 'text-blue-400' : 'text-zinc-400';
        if (file.locked) { icon = 'lock'; iconColor = 'text-amber-500'; }
        if (file.status === 'hidden') { icon = 'eye-off'; }

        row.innerHTML = `
            <div class="col-span-6 flex items-center gap-3">
                <i data-lucide="${icon}" class="w-4 h-4 ${iconColor}"></i>
                <span class="text-zinc-300 font-medium ${file.locked ? 'text-amber-200/80' : ''}">${file.name}</span>
            </div>
            <div class="col-span-2">
                <span class="px-2 py-0.5 rounded text-[10px] ${file.status === 'visible' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500'} border border-zinc-800">${file.status}</span>
            </div>
            <div class="col-span-2 text-zinc-500 font-mono">${file.size}</div>
            <div class="col-span-2 text-right opacity-0 group-hover:opacity-100 flex justify-end gap-2 transition-opacity">
                <button onclick="toggleFileVisibility(${wsId}, ${file.id})" class="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100" title="${file.status === 'visible' ? 'Ocultar' : 'Mostrar'}">
                    <i data-lucide="${file.status === 'visible' ? 'eye-off' : 'eye'}" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="toggleFileLock(${wsId}, ${file.id})" class="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100" title="${file.locked ? 'Destrancar' : 'Trancar'}">
                    <i data-lucide="${file.locked ? 'unlock' : 'lock'}" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="triggerDeleteFile(${wsId}, ${file.id})" class="p-1 hover:bg-red-900/30 rounded text-zinc-400 hover:text-red-400" title="Excluir">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        `;

        if (file.locked) {
            row.ondblclick = () => {
                const pass = prompt("Digite a senha para acessar esta pasta:");
                if (pass === '1234') {
                    showToast("Acesso concedido");
                } else {
                    showToast("Senha incorreta");
                }
            };
        } else if (file.type === 'file') {
            // Open File Logic
            row.ondblclick = async () => {
                let content = '';

                // If it's a local file, read from disk
                if (file.handle) {
                    try {
                        const fileData = await file.handle.getFile();
                        content = await fileData.text();
                    } catch (e) {
                        console.error(e);
                        showToast('Erro ao ler arquivo local');
                        return;
                    }
                } else {
                    // Mock content for virtual files
                    const existingNote = notes.find(n => n.title === file.name.replace(/\.[^/.]+$/, ""));
                    content = existingNote ? existingNote.content : `# ${file.name}\n\nConteúdo do arquivo...`;
                }

                // Create a temporary note object for the editor
                // Check if already open/exists in notes
                let noteId = file.id; // Use file ID as note ID for simplicity in this context
                let existingNoteIndex = notes.findIndex(n => n.id === noteId);

                if (existingNoteIndex === -1) {
                    // Create transient note
                    notes.push({
                        id: noteId,
                        title: file.name,
                        content: content,
                        category: 'Trabalho',
                        date: new Date().toISOString(),
                        fileHandle: file.handle, // Attach handle
                        location: { workspaceId: wsId, folderId: null } // Root of ws
                    });
                } else {
                    // Update existing
                    notes[existingNoteIndex].content = content;
                    notes[existingNoteIndex].fileHandle = file.handle;
                }

                openPreview(noteId);
            };
        }
        list.appendChild(row);
    });
    if (window.lucide) lucide.createIcons();
}

function toggleFileVisibility(wsId, fileId) {
    const file = workspaceFiles[wsId].find(f => f.id === fileId);
    if (file) {
        file.status = file.status === 'visible' ? 'hidden' : 'visible';
        renderExplorer(wsId);
    }
}

function toggleFileLock(wsId, fileId) {
    const file = workspaceFiles[wsId].find(f => f.id === fileId);
    if (file) {
        if (!file.locked) {
            const pass = prompt("Defina uma senha para trancar:");
            if (pass) {
                file.locked = true;
                showToast("Pasta trancada");
            }
        } else {
            const pass = prompt("Senha para destrancar:");
            if (pass) {
                file.locked = false;
                showToast("Pasta destrancada");
            }
        }
        renderExplorer(wsId);
    }
}

// --- IMPORT LOGIC ---
function triggerImportMenu() {
    document.getElementById('import-modal').classList.remove('hidden');
    document.getElementById('import-modal').classList.add('flex');
}

async function handleImport(type) {
    document.getElementById('import-modal').classList.add('hidden');
    document.getElementById('import-modal').classList.remove('flex');

    // Verificar se há workspace selecionado
    if (!currentWorkspaceId) {
        showToast('Selecione um workspace primeiro');
        console.warn('[Workspace] No workspace selected for import');
        return;
    }

    try {
        if (type === 'file') {
            const [handle] = await window.showOpenFilePicker();
            if (handle) {
                await addFileToWorkspace(currentWorkspaceId, handle);
            }
        } else if (type === 'folder') {
            const handle = await window.showDirectoryPicker();
            if (handle) {
                console.log('[Workspace] Importing folder:', handle.name, 'to workspace:', currentWorkspaceId);
                await addFolderToWorkspace(currentWorkspaceId, handle);
            }
        }
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error('[Workspace] Import error:', e);
            showToast('Erro na importação: ' + e.message);
        }
    }
}

async function addFileToWorkspace(wsId, handle) {
    const fileData = await handle.getFile();
    const newFile = {
        id: Date.now(),
        name: handle.name,
        type: 'file',
        size: formatSize(fileData.size),
        status: 'visible',
        locked: false,
        handle: handle // Store handle
    };

    workspaceFiles[wsId].push(newFile);
    saveData();
    renderExplorer(wsId);
    showToast(`Arquivo "${handle.name}" importado!`);
}

async function addFolderToWorkspace(wsId, handle) {
    try {
        // Registrar handle no FSHandler para acesso em saveCurrentNote
        FSHandler.handles[wsId] = handle;

        // Salvar handle para persistência (usando wsId como chave para restauração correta)
        if (typeof HandleStore !== 'undefined' && HandleStore.save) {
            await HandleStore.save(String(wsId), handle, 'directory');
        }

        // Ler todos os arquivos da pasta
        const files = [];
        for await (const entry of handle.values()) {
            if (entry.kind === 'file') {
                const file = await entry.getFile();
                const fileId = Date.now() + Math.floor(Math.random() * 10000);

                files.push({
                    id: fileId,
                    name: entry.name,
                    type: 'file',
                    size: file.size,
                    status: 'visible',
                    locked: false,
                    handle: entry,
                    lastModified: file.lastModified
                });

                // Se for arquivo .md, carregar como nota com o MESMO ID do arquivo
                if (entry.name.endsWith('.md') || entry.name.endsWith('.markdown')) {
                    try {
                        const content = await file.text();
                        const title = entry.name.replace(/\.(md|markdown)$/, '');

                        // Verificar se nota já existe
                        const existingNote = notes.find(n => n.title === title && n.location?.workspaceId === wsId);
                        if (!existingNote) {
                            notes.push({
                                id: fileId, // SAME ID as file!
                                title: title,
                                content: content,
                                category: 'Local',
                                date: new Date().toISOString(),
                                location: {
                                    workspaceId: wsId,
                                    folderId: fileId
                                },
                                fileHandle: entry
                            });
                        }
                    } catch (e) {
                        console.warn(`[Workspace] Failed to load note ${entry.name}:`, e);
                    }
                }
            } else if (entry.kind === 'directory') {
                files.push({
                    id: Date.now() + Math.random(),
                    name: entry.name,
                    type: 'folder',
                    size: '-',
                    status: 'visible',
                    locked: false,
                    handle: entry
                });
            }
        }

        // Adicionar pasta principal ao workspace (com arquivos como children)
        const newFolder = {
            id: Date.now(),
            name: handle.name,
            type: 'folder',
            size: '-',
            status: 'visible',
            locked: false,
            handle: handle,
            isMount: true,
            children: files
        };

        workspaceFiles[wsId].push(newFolder);

        // NÃO adicionar arquivos separadamente - eles já estão em children

        saveData();
        renderExplorer(wsId);
        renderNotes();

        const fileCount = files.filter(f => f.type === 'file').length;
        const noteCount = files.filter(f => f.name.endsWith('.md') || f.name.endsWith('.markdown')).length;
        showToast(`Pasta "${handle.name}" vinculada! ${fileCount} arquivos, ${noteCount} notas carregadas.`);

        console.log(`[Workspace] Folder "${handle.name}" added with ${fileCount} files and ${noteCount} notes`);
    } catch (e) {
        console.error('[Workspace] Error adding folder:', e);
        showToast('Erro ao adicionar pasta: ' + e.message);
    }
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// --- DELETE LOGIC ---
function triggerDeleteFile(wsId, fileId) {
    const file = workspaceFiles[wsId].find(f => f.id === fileId);
    if (!file) return;

    pendingDeleteWsId = wsId;
    pendingDeleteFileId = fileId;

    const modal = document.getElementById('delete-modal');
    const nameEl = document.getElementById('delete-filename');
    const deleteDiskBtn = document.getElementById('btn-delete-disk');

    if (nameEl) nameEl.innerText = file.name;

    // Only show "Delete from disk" for local files with handles
    if (deleteDiskBtn) {
        deleteDiskBtn.style.display = file.handle ? 'flex' : 'none';
    }

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    pendingDeleteWsId = null;
    pendingDeleteFileId = null;
}

async function confirmDeleteAction(action) {
    // Check if this is a virtual note deletion (from editor, not workspace)
    if (typeof pendingDeleteNoteId !== 'undefined' && pendingDeleteNoteId !== null) {
        if (typeof confirmDeleteNoteAction === 'function') {
            confirmDeleteNoteAction();
        }
        return;
    }

    if (pendingDeleteWsId === null || pendingDeleteFileId === null) return;

    const wsId = pendingDeleteWsId;
    const fileId = pendingDeleteFileId;
    const fileIndex = workspaceFiles[wsId].findIndex(f => f.id === fileId);

    if (fileIndex === -1) {
        closeDeleteModal();
        return;
    }


    const file = workspaceFiles[wsId][fileIndex];

    if (action === 'disk' && file.handle) {
        try {
            // Find parent handle if possible or use FSHandler
            // For now, let's assume we need to delete from the mounted workspace
            const workspace = workspaces.find(w => w.id === wsId);
            const wsHandle = FSHandler.handles[wsId];

            if (wsHandle) {
                const success = await FSHandler.deleteFile(wsHandle, file.name);
                if (!success) {
                    showToast('Não foi possível excluir do disco.');
                    return;
                }
            }
        } catch (e) {
            console.error(e);
            showToast('Erro ao excluir do disco.');
            return;
        }
    }

    // Remove from UI/State
    workspaceFiles[wsId].splice(fileIndex, 1);

    // Also remove from notes array if exists
    const noteIndex = notes.findIndex(n => n.id === fileId);
    if (noteIndex > -1) {
        notes.splice(noteIndex, 1);
    }

    // Clean up canvas positions
    if (typeof canvasState !== 'undefined' && canvasState.positions) {
        delete canvasState.positions[fileId];
        if (typeof saveCanvasLayout === 'function') saveCanvasLayout();
    }

    // If it was the current open note, close the editor
    if (typeof currentNoteId !== 'undefined' && currentNoteId === fileId) {
        if (typeof closePreview === 'function') closePreview();
        if (typeof renderNotes === 'function') renderNotes();
    }

    saveData();
    renderExplorer(wsId);
    closeDeleteModal();
    showToast(action === 'disk' ? 'Arquivo excluído permanentemente' : 'Arquivo removido do workspace');

}
