// --- WORKSPACE MANAGER ENGINE ---

let pendingDeleteWsId = null;
let pendingDeleteFileId = null;

function openWorkspaceManager() {
    document.getElementById('workspace-modal').classList.remove('hidden');
    document.getElementById('workspace-modal').classList.add('flex');
    renderWorkspaces();
    renderExplorer(window.currentWorkspaceId);
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
    window.currentWorkspaceId = newId;
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

    console.log('[Workspaces] Rendering workspaces:', window.workspaces?.length, 'items');

    const colorMap = {
        'blue': { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500', px: 'bg-blue-500' },
        'emerald': { border: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-500', px: 'bg-emerald-500' },
        'amber': { border: 'border-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-500', px: 'bg-amber-500' },
        'purple': { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-500', px: 'bg-purple-500' }
    };

    (window.workspaces || []).forEach(ws => {
        const isSelected = ws.id === window.currentWorkspaceId;
        const colors = colorMap[ws.color] || colorMap['blue'];

        const card = document.createElement('div');
        let borderClass = isSelected ? colors.border : 'border-zinc-800';
        let bgClass = isSelected ? colors.bg : 'bg-zinc-900/50';

        card.className = `min-w-[280px] h-full ${bgClass} border ${borderClass} rounded-xl p-5 flex flex-col justify-between cursor-pointer hover:border-zinc-600 transition-all group relative overflow-hidden`;
        card.onclick = (e) => {
            // Don't switch if clicking on menu
            if (e.target.closest('.ws-menu-btn') || e.target.closest('.ws-menu-dropdown')) return;
            switchWorkspace(ws.id);
        };

        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-2">
                    <div class="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center ${colors.text} shadow-inner">
                        <i data-lucide="box" class="w-5 h-5"></i>
                    </div>
                    <div class="flex items-center gap-2">
                        ${isSelected ? `<span class="${colors.px} text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Ativo</span>` : ''}
                        <div class="relative">
                            <button class="ws-menu-btn p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-100 transition-colors opacity-0 group-hover:opacity-100" 
                                onclick="event.stopPropagation(); toggleWsMenu(${ws.id})">
                                <i data-lucide="more-vertical" class="w-4 h-4"></i>
                            </button>
                            <div id="ws-menu-${ws.id}" class="ws-menu-dropdown absolute right-0 top-full mt-1 w-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl hidden z-50">
                                <button onclick="event.stopPropagation(); openRenameWorkspace(${ws.id})" 
                                    class="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors rounded-t-lg">
                                    <i data-lucide="pencil" class="w-3.5 h-3.5"></i> Renomear
                                </button>
                                <button onclick="event.stopPropagation(); confirmDeleteWorkspace(${ws.id})" 
                                    class="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-zinc-800 transition-colors rounded-b-lg">
                                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <h3 class="font-bold text-zinc-100 text-lg">${ws.name}</h3>
                <p class="text-xs text-zinc-500 mt-1">${ws.desc || ''}</p>
            </div>
            <div class="flex items-center gap-2 text-[10px] text-zinc-600 font-mono mt-4">
                <i data-lucide="clock" class="w-3 h-3"></i>
                <span>${new Date(ws.date).toLocaleDateString()}</span>
            </div>
            ${isSelected ? '' : `<div class="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center backdrop-blur-[1px] transition-all pointer-events-none"><span class="bg-zinc-100 text-zinc-950 px-3 py-1 rounded-full text-xs font-bold shadow-xl">Selecionar</span></div>`}
        `;
        list.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}

// Toggle workspace menu
function toggleWsMenu(wsId) {
    // Close all other menus first
    document.querySelectorAll('.ws-menu-dropdown').forEach(menu => {
        if (menu.id !== `ws-menu-${wsId}`) menu.classList.add('hidden');
    });

    const menu = document.getElementById(`ws-menu-${wsId}`);
    menu.classList.toggle('hidden');

    if (!menu.classList.contains('hidden')) {
        if (window.lucide) lucide.createIcons();
        // Close on outside click
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!e.target.closest(`#ws-menu-${wsId}`) && !e.target.closest('.ws-menu-btn')) {
                    menu.classList.add('hidden');
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 10);
    }
}

// Open rename modal
function openRenameWorkspace(wsId) {
    const ws = window.workspaces.find(w => w.id === wsId);
    if (!ws) return;

    window.pendingRenameWsId = wsId;

    // Use prompt or create a modal
    const newName = prompt('Novo nome do workspace:', ws.name);
    if (newName && newName.trim() && newName !== ws.name) {
        ws.name = newName.trim();
        saveData();
        renderWorkspaces();
        showToast(`Workspace renomeado para "${newName.trim()}"`);
    }
}

// Confirm delete workspace
function confirmDeleteWorkspace(wsId) {
    const ws = window.workspaces.find(w => w.id === wsId);
    if (!ws) return;

    // Don't allow deleting last workspace
    if (window.workspaces.length <= 1) {
        showToast('Não é possível excluir o último workspace');
        return;
    }

    if (confirm(`Tem certeza que deseja excluir o workspace "${ws.name}"?\n\nIsso não excluirá os arquivos do disco, apenas a referência no Cromva.`)) {
        deleteWorkspace(wsId);
    }
}

// Delete workspace
function deleteWorkspace(wsId) {
    // Remove from workspaces array
    window.workspaces = window.workspaces.filter(w => w.id !== wsId);

    // Remove associated files
    delete window.workspaceFiles[wsId];

    // If deleted the current workspace, switch to first available
    if (window.currentWorkspaceId === wsId) {
        window.currentWorkspaceId = window.workspaces[0]?.id || null;
    }

    saveData();
    renderWorkspaces();
    renderExplorer(window.currentWorkspaceId);
    renderNotes();

    showToast('Workspace excluído');
}

function switchWorkspace(id) {
    window.currentWorkspaceId = id;
    // Persist
    saveData();
    renderExplorer(id);
    renderWorkspaces();
    renderNotes(); // Refresh notes for new workspace
    showToast(`Workspace alterado para ${workspaces.find(w => w.id === id).name}`);
}

// Função auxiliar para obter arquivos do workspace (Virtual ou Físico)
function getWorkspaceFiles(wsId) {
    const physicalFiles = window.workspaceFiles[wsId] || [];

    // Buscar notas virtuais (sem handle) associadas a este workspace
    const virtualNotes = window.notes.filter(n =>
        !n.fileHandle &&
        n.location &&
        n.location.workspaceId === wsId
    ).map(n => ({
        id: n.id,
        name: n.title + '.md',
        type: 'file',
        size: 'Virtual',
        status: 'visible',
        locked: false,
        isVirtual: true,
        noteId: n.id
    }));

    // Sempre criar a pasta virtual LocalStorage, mesmo vazia, conforme solicitado
    const virtualFolder = {
        id: 'virtual_folder_' + wsId,
        name: 'LocalStorage',
        type: 'folder',
        size: '-',
        status: 'visible',
        locked: false,
        isVirtualFolder: true,
        children: virtualNotes
    };

    // Retornar arquivos físicos + pasta virtual
    return [...physicalFiles, virtualFolder];
}

function renderExplorer(wsId) {
    const workspace = window.workspaces.find(w => w.id === wsId);
    if (!workspace) return;

    // Update workspace header
    if (document.getElementById('current-workspace-name')) {
        document.getElementById('current-workspace-name').innerText = workspace.name;
    }
    if (document.getElementById('current-workspace-path')) {
        document.getElementById('current-workspace-path').innerText = `/${workspace.name.toLowerCase().replace(/\s/g, '-')}`;
    }

    // State for expanded folders (persist in window)
    if (!window.explorerExpandedFolders) window.explorerExpandedFolders = new Set();

    const list = document.getElementById('explorer-list');
    list.innerHTML = '';

    const files = getWorkspaceFiles(wsId);
    console.log('[Workspaces] renderExplorer files:', files);

    if (files.length === 0) {
        list.innerHTML = `<div class="flex flex-col items-center justify-center h-40 text-zinc-600">
            <i data-lucide="folder-open" class="w-10 h-10 mb-2 opacity-20"></i>
            <p class="text-xs">Este workspace está vazio</p>
        </div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    const renderFileRow = (file, level = 0) => {
        // ... (resto da função de renderização igual, apenas file source muda)
        // Precisamos ajustar o click handler para notas virtuais?
        // openFile já lida com notas existentes via ID/Title.

        const row = document.createElement('div');
        const paddingLeft = level * 20 + 16;
        row.className = `grid grid-cols-12 py-3 border-b border-zinc-800/30 hover:bg-zinc-900/50 items-center text-xs group transition-colors cursor-pointer ${file.status === 'hidden' ? 'opacity-50 grayscale' : ''}`;
        row.style.paddingLeft = `${paddingLeft}px`;
        row.style.paddingRight = '16px';

        let icon = file.type === 'folder' ? 'folder' : 'file';
        let iconColor = file.type === 'folder' ? 'text-blue-400' : 'text-zinc-400';

        // Custom styling for Virtual Folder (LocalStorage)
        if (file.isVirtualFolder) {
            icon = 'database'; // Ícone distinto
            iconColor = 'text-emerald-500';
            row.classList.add('bg-emerald-900/10');
        }

        // Folder expansion state
        let isExpanded = false;
        if (file.type === 'folder') {
            isExpanded = window.explorerExpandedFolders.has(file.id);
            if (!file.isVirtualFolder) { // Keep standard icon logic for normal folders unless we want custom open icon for virtual too?
                icon = isExpanded ? 'folder-open' : icon;
            }
        }

        // Virtual/External file styling
        if (file.size === 'Externo') {
            icon = 'file-symlink';
            iconColor = 'text-purple-400';
            row.classList.add('bg-purple-900/10');
        } else if (file.size === 'Virtual') {
            icon = 'sticky-note'; // Novo ícone para notas virtuais
            iconColor = 'text-green-400';
            row.classList.add('bg-green-900/5');
        } else if (file.locked) {
            icon = 'lock';
            iconColor = 'text-amber-500';
        } else if (file.status === 'hidden') {
            icon = 'eye-off';
        }

        row.innerHTML = `
            <div class="col-span-6 flex items-center gap-3">
                ${file.type === 'folder' ?
                `<i data-lucide="${isExpanded ? 'chevron-down' : 'chevron-right'}" class="w-3 h-3 text-zinc-600"></i>` :
                `<div class="w-3 h-3"></div>`
            }
                <i data-lucide="${icon}" class="w-4 h-4 ${iconColor}"></i>
                <span class="font-medium text-zinc-300 truncate">${file.name}</span>
                ${file.locked ? '<i data-lucide="lock" class="w-3 h-3 text-amber-500/50"></i>' : ''}
                ${file.size === 'Externo' ? '<span class="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 rounded">Externo</span>' : ''}
                ${file.size === 'Virtual' ? '<span class="text-[10px] bg-green-500/20 text-green-300 px-1.5 rounded">Local</span>' : ''}
            </div>
            <div class="col-span-2">
                <span class="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">${file.status === 'visible' ? 'visível' : 'oculto'}</span>
            </div>
            <div class="col-span-2 text-zinc-500 font-mono text-[10px]">
                ${file.size || '-'}
            </div>
            <div class="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="event.stopPropagation(); toggleFileVisibility(${wsId}, '${file.id}')" class="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100" title="${file.status === 'visible' ? 'Ocultar' : 'Mostrar'}">
                    <i data-lucide="${file.status === 'visible' ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="event.stopPropagation(); toggleFileLock(${wsId}, '${file.id}')" class="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-100" title="${file.locked ? 'Destrancar' : 'Trancar'}">
                    <i data-lucide="${file.locked ? 'unlock' : 'lock'}" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="event.stopPropagation(); triggerDeleteFile(${wsId}, '${file.id}')" class="p-1 hover:bg-red-900/30 rounded text-zinc-400 hover:text-red-400" title="Excluir">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        `;

        row.onclick = async (e) => {
            // Stop propagation to avoid double triggering if clicking inside specific areas (though buttons handle this)

            if (file.locked) {
                const pass = prompt(`Digite a senha para acessar "${file.name}":`);
                if (!pass) return;
                if (btoa(pass) !== file.passwordHash) {
                    showToast("Senha incorreta");
                    return;
                }
            }

            if (file.type === 'folder') {
                // Toggle expansion
                if (window.explorerExpandedFolders.has(file.id)) {
                    window.explorerExpandedFolders.delete(file.id);
                } else {
                    window.explorerExpandedFolders.add(file.id);
                }
                renderExplorer(wsId);
            } else {
                // Check if specialized handler for virtual file needed? 
                // openFile handles virtual if file.handle is missing.
                await openFile(wsId, file);
                closeWorkspaceManager(); // Auto close on open
            }
        };

        list.appendChild(row);

        // Render children if expanded
        if (file.type === 'folder' && isExpanded && file.children && file.children.length > 0) {
            file.children.forEach(child => renderFileRow(child, level + 1));
        }
    };

    files.forEach(file => renderFileRow(file, 0));

    if (window.lucide) lucide.createIcons();
}

// Listener removido, funcionalidade substituída pela pasta virtual injetada
// window.addEventListener('load', ...); removed

async function openFile(wsId, file) {
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
        const existingNote = window.notes.find(n => n.title === file.name.replace(/\.[^/.]+$/, ""));
        content = existingNote ? existingNote.content : `# ${file.name}\n\nConteúdo do arquivo...`;
    }

    // Create a temporary note object or update existing
    let noteId = file.id;
    let existingNoteIndex = window.notes.findIndex(n => n.id === noteId);

    if (existingNoteIndex === -1) {
        // Create transient note
        // Obter titulo sem extensao
        const title = file.name.replace(/\.(md|markdown|txt)$/i, '');
        window.notes.push({
            id: noteId,
            title: title,
            content: content,
            category: 'Trabalho',
            date: new Date().toISOString(),
            fileHandle: file.handle,
            location: { workspaceId: wsId, folderId: null }
        });
    } else {
        // Update existing
        window.notes[existingNoteIndex].content = content;
        window.notes[existingNoteIndex].fileHandle = file.handle;
    }

    // Open note
    const note = window.notes.find(n => n.id === noteId);
    if (note) {
        window.currentNoteId = note.id;
        closeWorkspaceManager();
        renderNotes();
        // Open preview directly, indicating already authenticated via workspace manager
        if (typeof openPreview === 'function') openPreview(note.id, true);
    } else {
        showToast('Nota não encontrada');
    }
}

function toggleFileVisibility(wsId, fileId) {
    console.log('[Workspaces] toggleFileVisibility for:', fileId);
    const file = workspaceFiles[wsId].find(f => f.id == fileId);
    if (file) {
        file.status = file.status === 'visible' ? 'hidden' : 'visible';
        saveData();
        renderExplorer(wsId);
        renderNotes();
    }
}

function toggleFileLock(wsId, fileId) {
    console.log('[Workspaces] toggleFileLock for:', fileId);
    const file = workspaceFiles[wsId].find(f => f.id == fileId);
    if (!file) return;

    if (!file.locked) {
        const pass = prompt(`Defina uma senha para trancar "${file.name}":`);
        if (pass) {
            file.locked = true;
            file.passwordHash = btoa(pass); // Simple Base64 hash
            saveData();
            showToast("Item trancado com sucesso");
        }
    } else {
        const pass = prompt("Senha para destrancar:"); // Para destrancar permanentemente
        if (pass && btoa(pass) === file.passwordHash) {
            file.locked = false;
            delete file.passwordHash;
            saveData();
            showToast("Item destrancado permanentemente");
        } else {
            showToast("Senha incorreta");
        }
    }
    renderExplorer(wsId);
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
    if (!window.currentWorkspaceId) {
        showToast('Selecione um workspace primeiro');
        console.warn('[Workspace] No workspace selected for import');
        return;
    }

    try {
        if (type === 'file') {
            const [handle] = await window.showOpenFilePicker();
            if (handle) {
                await addFileToWorkspace(window.currentWorkspaceId, handle);
            }
        } else if (type === 'folder') {
            const handle = await window.showDirectoryPicker();
            if (handle) {
                console.log('[Workspace] Importing folder:', handle.name, 'to workspace:', window.currentWorkspaceId);
                await addFolderToWorkspace(window.currentWorkspaceId, handle);
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
                        console.warn(`[Workspace] Failed to load note ${entry.name}: `, e);
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

// Global state vars for delete modal
window.pendingDeleteWsId = null;
window.pendingDeleteFileId = null;

// --- DELETE LOGIC ---
function triggerDeleteFile(wsId, fileId) {
    const files = getWorkspaceFiles(wsId);

    // Helper to find file recursively
    const findFileRecursively = (items, id) => {
        for (const item of items) {
            if (item.id == id) return item;
            if (item.children && item.children.length > 0) {
                const found = findFileRecursively(item.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const file = findFileRecursively(files, fileId);
    if (!file) return;

    window.pendingDeleteWsId = wsId;
    window.pendingDeleteFileId = fileId;
    // Clear note delete state just in case
    if (typeof window.pendingDeleteNoteId !== 'undefined') window.pendingDeleteNoteId = null;

    const modal = document.getElementById('delete-modal');
    const nameEl = document.getElementById('delete-filename');
    const deleteDiskBtn = document.getElementById('btn-delete-disk');

    if (nameEl) nameEl.innerText = file.name;

    // Only show "Delete from disk" for local files with handles
    if (deleteDiskBtn) {
        deleteDiskBtn.style.display = file.handle ? 'flex' : 'none';

        // Se for pasta, avisar que é recursivo
        if (file.type === 'folder') {
            deleteDiskBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i> Excluir do Disco (Tudo)';
        } else {
            deleteDiskBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i> Excluir do Disco';
        }
    }

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    if (window.lucide) lucide.createIcons();
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    window.pendingDeleteWsId = null;
    window.pendingDeleteFileId = null;
    if (typeof window.pendingDeleteNoteId !== 'undefined') window.pendingDeleteNoteId = null;
}

async function confirmDeleteAction(action) {
    // Check if this is a virtual note deletion (from editor, not workspace)
    if (typeof window.pendingDeleteNoteId !== 'undefined' && window.pendingDeleteNoteId !== null) {
        if (typeof confirmDeleteNoteAction === 'function') {
            confirmDeleteNoteAction();
        }
        closeDeleteModal(); // Ensure modal is closed after virtual note deletion
        return;
    }

    // The 'action' parameter is passed to this function, so we should use it.
    // The provided snippet had `const action = 'remove';` which would override it.
    console.log('[Workspaces] confirmDeleteAction called with action:', action);

    const wsId = window.pendingDeleteWsId;
    const fileId = window.pendingDeleteFileId;

    if (wsId === null || fileId === null) {
        return;
    }

    // 1. Encontrar o arquivo alvo (recursivamente, pois pode estar em pasta virtual ou física)
    const allFiles = getWorkspaceFiles(wsId);
    const findRecursively = (items, id) => {
        for (const item of items) {
            if (item.id == id) return item;
            if (item.children) {
                const found = findRecursively(item.children, id);
                if (found) return found;
            }
        }
        return null;
    };
    const file = findRecursively(allFiles, fileId);

    if (!file) {
        closeDeleteModal();
        return;
    }

    // 2. Se for arquivo virtual (nota local), remover apenas da memória
    if (file.isVirtual) {
        console.log('[Workspaces] Deleting virtual note:', fileId);
        const noteIndex = window.notes.findIndex(n => n.id == fileId);
        if (noteIndex >= 0) {
            window.notes.splice(noteIndex, 1);
            showToast('Nota local excluída.');
            saveData();
            renderExplorer(wsId);
            renderNotes();
        }
        closeDeleteModal();
        return;
    }

    // 3. Exclusão física (ainda limitada à raiz por enquanto, ou melhorada se possível)
    // Para remover da memória visual (workspaceFiles), precisamos saber onde ele está
    // Mas a renderização é reconstruída a partir de workspaceFiles.
    // Se removermos o arquivo físico, precisamos remover de workspaceFiles.
    // O problema é achar o pai em workspaceFiles para dar splice.

    // Por enquanto, mantemos a lógica antiga para físicos, mas adaptada
    // A lógica antiga usava workspaceFiles[wsId].findIndex... que é só raiz.

    // Se o arquivo físico não estiver na raiz, a exclusão da memória vai falhar silenciosamente aqui
    // Mas vamos tentar deletar do disco (se for ação disk).

    /* ... Lógica de exclusão física ... */
    // Se o arquivo não está na raiz, findIndex retorna -1.
    const rootIndex = workspaceFiles[wsId].findIndex(f => f.id == fileId);

    if (action === 'disk' && file.handle) {
        try {
            // Find parent handle if possible or use FSHandler
            // For now, let's assume we need to delete from the mounted workspace
            const workspace = workspaces.find(w => w.id === wsId);
            const wsHandle = FSHandler.handles[wsId];

            if (wsHandle) {
                const isDir = file.type === 'folder';
                const success = await FSHandler.deleteEntry(wsHandle, file.name, isDir);
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

    // Se encontrou na raiz, remove. Se não, teria que buscar e remover do pai.
    if (rootIndex > -1) {
        workspaceFiles[wsId].splice(rootIndex, 1);
    } else {
        // TODO: Implementar remoção de filhos em workspaceFiles
        // Mas como getWorkspaceFiles lê do disco/memória, se deletar do disco e recarregar, some.
    }

    // Remover notas associadas (memória)
    const noteIndex = window.notes.findIndex(n => n.id == fileId);
    if (noteIndex > -1) {
        window.notes.splice(noteIndex, 1);
    }

    // Se for pasta, remover recursivamente todas as notas e referências descendentes
    if (file.type === 'folder') {
        const collectDescendantIds = (item) => {
            let ids = [item.id];
            if (item.children && Array.isArray(item.children)) {
                item.children.forEach(child => {
                    ids = ids.concat(collectDescendantIds(child));
                });
            }
            return ids;
        };

        const allIdsToRemove = collectDescendantIds(file);

        // Remove notes that match any ID in the tree OR are located inside any folder in the tree
        const notesToRemove = notes.filter(n =>
            allIdsToRemove.includes(n.id) ||
            (n.location && allIdsToRemove.includes(n.location.folderId))
        );

        if (notesToRemove.length > 0) {
            console.log(`[Workspaces] Removing ${notesToRemove.length} descendant notes/files`);
            notesToRemove.forEach(n => {
                const idx = notes.indexOf(n);
                if (idx > -1) notes.splice(idx, 1);
            });
        }
    }

    // Clean up canvas positions
    if (typeof canvasState !== 'undefined' && canvasState.positions) {
        delete canvasState.positions[fileId];
        if (typeof saveCanvasLayout === 'function') saveCanvasLayout();
    }

    // If it was the current open note, close the editor
    if (typeof currentNoteId !== 'undefined' && currentNoteId == fileId) {
        if (typeof closePreview === 'function') closePreview();
    }

    saveData();
    renderExplorer(wsId);
    renderNotes(); // Atualizar lista de notas para refletir exclusão
    closeDeleteModal();
    showToast(action === 'disk' ? 'Arquivo excluído permanentemente' : 'Arquivo removido do workspace');
}

// Expose to window explicitly
window.confirmDeleteAction = confirmDeleteAction;
