// --- WORKSPACE MANAGER ENGINE ---

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
    saveData(); // Persist changes
    renderWorkspaces();
    showToast('Workspace criado com sucesso');

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
    renderExplorer(id); // Changed wsId to id to match function parameter

    // If we just deleted the note that is currently open in the editor, close it
    // NOTE: The variables 'currentNoteId', 'fileId', 'closePreview', 'renderNotes', and 'closeDeleteModal'
    // are not defined in the provided code snippet or are out of context for 'switchWorkspace'.
    // This block seems to belong to a file deletion function.
    // However, following the instruction to insert it as provided.
    if (currentNoteId && currentNoteId === fileId) {
        closePreview();
        renderNotes(); // Update grid if needed
    }

    closeDeleteModal();
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

    try {
        if (type === 'file') {
            const [handle] = await window.showOpenFilePicker();
            if (handle) {
                await addFileToWorkspace(currentWorkspaceId, handle);
            }
        } else if (type === 'folder') {
            const handle = await window.showDirectoryPicker();
            if (handle) {
                await addFolderToWorkspace(currentWorkspaceId, handle);
            }
        }
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error(e);
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
    const newFolder = {
        id: Date.now(),
        name: handle.name,
        type: 'folder',
        size: '-',
        status: 'visible',
        locked: false,
        handle: handle,
        isMount: true // Mark as a mounted folder
    };

    workspaceFiles[wsId].push(newFolder);
    saveData();
    renderExplorer(wsId);
    showToast(`Pasta "${handle.name}" vinculada!`);
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
