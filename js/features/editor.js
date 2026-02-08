// --- EDITOR LOGIC ---

// Track original content to compare for save button state
window.originalNoteContent = null;
window.originalNoteTitle = null;

// Auto-save configuration
let autoSaveTimer = null;
const AUTO_SAVE_DELAY = window.CromvaConfig?.EDITOR?.AUTO_SAVE_DELAY || 2000;
let hasUnsavedChanges = false;

/**
 * Debounced auto-save function
 */
function scheduleAutoSave() {
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
    }

    hasUnsavedChanges = true;
    updateUnsavedIndicator(true);

    autoSaveTimer = setTimeout(() => {
        if (hasUnsavedChanges && window.currentNoteId) {
            console.log('[Editor] Auto-saving...');
            saveCurrentNote();
            hasUnsavedChanges = false;
            updateUnsavedIndicator(false);
        }
    }, AUTO_SAVE_DELAY);
}

/**
 * Atualiza indicador visual de alterações não salvas
 */
function updateUnsavedIndicator(unsaved) {
    const indicator = document.getElementById('unsaved-indicator');
    const title = document.getElementById('modal-title-input');

    if (unsaved) {
        // Adicionar asterisco ao título
        if (title && !document.title.startsWith('• ')) {
            document.title = '• ' + document.title;
        }

        // Mostrar indicador se existir
        if (indicator) indicator.classList.remove('hidden');
    } else {
        // Remover asterisco
        if (document.title.startsWith('• ')) {
            document.title = document.title.substring(2);
        }

        // Esconder indicador
        if (indicator) indicator.classList.add('hidden');
    }
}


function updateSaveButtonState() {
    const btn = document.getElementById('btn-save-note');
    if (!btn) return;

    const currentTitle = document.getElementById('modal-title-input').value;
    const currentContent = document.getElementById('modal-textarea').value;

    const hasChanges = currentTitle !== window.originalNoteTitle || currentContent !== window.originalNoteContent;

    if (hasChanges) {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.classList.add('hover:text-emerald-400', 'hover:bg-zinc-800');
        btn.title = 'Salvar alterações';
    } else {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        btn.classList.remove('hover:text-emerald-400', 'hover:bg-zinc-800');
        btn.title = 'Nenhuma alteração para salvar';
    }
}
function isNoteVisible(n) {
    const wsId = window.currentWorkspaceId;

    // 1. Basic Workspace Filter
    if (!n.location) return !wsId;
    if (wsId && n.location.workspaceId !== wsId) return false;

    // 2. Visibility Filter
    if (wsId) {
        const wsFiles = window.workspaceFiles[wsId] || [];
        let file = wsFiles.find(f => f.id === n.id);
        if (file && file.status === 'hidden') return false;

        if (n.location.folderId) {
            const folder = wsFiles.find(f => f.id === n.location.folderId && f.type === 'folder');
            if (folder && folder.status === 'hidden') return false;

            if (!file && folder && folder.children) {
                const child = folder.children.find(c => c.id === n.id);
                if (child && child.status === 'hidden') return false;
            }
        }
    }
    return true;
}

function renderNotes() {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Get notes from memory - FILTER by current workspace AND visibility
    const wsId = window.currentWorkspaceId;
    let allItems = window.notes.filter(n => isNoteVisible(n));

    // Add files from current workspace that are .md files and not already in notes
    if (wsId && window.workspaceFiles[wsId]) {
        const fileRefs = [];

        // Helper to collect files recursively
        const collectFiles = (items, parentFolderId = null) => {
            items.forEach(item => {
                if (item.status === 'hidden') return;

                if (item.type === 'folder' && item.children) {
                    collectFiles(item.children, item.id);
                } else if (item.type === 'file' && item.name.endsWith('.md')) {
                    // Check if already loaded as note
                    const isLoaded = allItems.some(n => n.id === item.id || (n.location && n.location.folderId === (parentFolderId || item.id) && n.title === item.name.replace('.md', '')));

                    if (!isLoaded) {
                        fileRefs.push({
                            id: item.id,
                            title: item.name.replace('.md', ''),
                            content: '(Arquivo local - Clique para carregar)',
                            category: parentFolderId ? 'Pasta' : 'Raiz', // Could show folder name but needs lookup
                            date: new Date().toISOString(), // No date info easily avail without stat
                            isFileRef: true,
                            handle: item.handle,
                            location: { workspaceId: wsId, folderId: parentFolderId || (item.id) }
                        });
                    }
                }
            });
        };

        collectFiles(window.workspaceFiles[wsId]);

        fileRefs.forEach(ref => allItems.push(ref));
    }

    const sortedNotes = allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedNotes.forEach(note => {
        const date = new Date(note.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const preview = note.content.substring(0, 120).replace(/[#*`>]/g, '') + '...';
        const isFileRef = note.isFileRef;

        const card = document.createElement('div');
        card.className = `glass p-5 rounded-xl cursor-pointer hover:border-zinc-500 hover:shadow-2xl hover:shadow-zinc-900/50 transition-all duration-300 hover:-translate-y-1 group flex flex-col h-48 relative ${isFileRef ? 'border-emerald-800/50' : 'border-zinc-800'}`;
        card.onclick = () => openPreview(note.id);
        card.innerHTML = `
                    <div class="flex justify-between items-start mb-3">
                        <span class="text-[9px] font-bold ${isFileRef ? 'text-emerald-500 border-emerald-800' : 'text-zinc-500 border-zinc-800'} uppercase tracking-widest border px-2 py-0.5 rounded bg-zinc-900/50">${note.category}</span>
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="${isFileRef ? 'hard-drive' : 'arrow-up-right'}" class="w-4 h-4 ${isFileRef ? 'text-emerald-500' : 'text-zinc-500'} hover:text-zinc-200"></i></div>
                    </div>
                    <h3 class="font-bold text-zinc-100 mb-2 truncate text-base">${note.title}</h3>
                    <p class="text-xs text-zinc-400 leading-relaxed line-clamp-3 flex-1">${preview}</p>
                    <div class="mt-4 pt-3 border-t border-zinc-800/50 text-[10px] text-zinc-600 flex justify-between items-center"><span>Editado em ${date}</span></div>
                `;
        grid.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
    renderRecents();
}

function renderRecents() {
    const list = document.getElementById('recent-list');
    const count = document.getElementById('recent-count');
    if (!list || !count) return;

    list.innerHTML = '';

    // Filter visible notes for recents too
    const visibleNotes = window.notes.filter(n => isNoteVisible(n));
    // Sort by date descending
    visibleNotes.sort((a, b) => new Date(b.date) - new Date(a.date));

    const recents = visibleNotes.slice(0, 5);
    count.innerText = visibleNotes.length;

    recents.forEach(note => {
        const item = document.createElement('div');
        item.className = 'flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/30 rounded cursor-pointer group transition-colors';
        item.onclick = () => openPreview(note.id);
        item.innerHTML = `<i data-lucide="file-text" class="w-3.5 h-3.5 opacity-50 group-hover:opacity-100"></i><span class="truncate w-full">${note.title}</span>`;
        list.appendChild(item);
    });
    if (window.lucide) lucide.createIcons();
}

function setEditorMode(mode) {
    const paneEdit = document.getElementById('pane-edit');
    const panePreview = document.getElementById('pane-preview');
    document.querySelectorAll('[id^="btn-mode-"]').forEach(btn => btn.classList.remove('editor-mode-active', 'text-zinc-200'));
    const activeBtn = document.getElementById(`btn-mode-${mode}`);
    if (activeBtn) {
        activeBtn.classList.add('editor-mode-active', 'text-zinc-200');
        activeBtn.classList.remove('text-zinc-400');
    }

    paneEdit.className = 'hidden h-full border-r border-zinc-800 bg-[#09090b]';
    panePreview.className = 'flex-1 h-full overflow-y-auto custom-scrollbar bg-[#09090b]';

    if (mode === 'preview') { paneEdit.classList.add('hidden'); panePreview.classList.remove('hidden'); }
    else if (mode === 'edit') { paneEdit.classList.remove('hidden'); paneEdit.classList.add('flex-1'); panePreview.classList.add('hidden'); }
    else if (mode === 'split') { paneEdit.classList.remove('hidden'); panePreview.classList.remove('hidden'); paneEdit.classList.add('w-1/2'); panePreview.classList.remove('flex-1'); panePreview.classList.add('w-1/2'); }

    updatePreviewRender();
}

async function openPreview(id, authenticated = false) {
    if (!authenticated) {
        // Security Check: Lock
        let wsId = window.currentWorkspaceId;
        const note = window.notes.find(n => n.id === id);
        if (note && note.location) wsId = note.location.workspaceId;

        if (wsId) {
            const wsFiles = window.workspaceFiles[wsId] || [];

            // Check direct file lock
            let file = wsFiles.find(f => f.id === id);

            // If not found in root, check if inside folder (mounts)
            if (!file) {
                for (const folder of wsFiles) {
                    if (folder.children && Array.isArray(folder.children)) {
                        file = folder.children.find(f => f.id === id);
                        if (file) break;
                    }
                }
            }

            if (file && file.locked) {
                const pass = prompt(`Arquivo "${file.name}" protegido por senha:`);
                if (!pass || btoa(pass) !== file.passwordHash) {
                    showToast("Senha incorreta");
                    return;
                }
            }

            // Check parent folder lock
            let folderId = note?.location?.folderId;
            // If file ref, logic might differ but assuming folderId is reliable if linked

            if (folderId) {
                const folder = wsFiles.find(f => f.id === folderId && f.type === 'folder');
                if (folder && folder.locked) {
                    const pass = prompt(`Pasta "${folder.name}" protegida por senha:`);
                    if (!pass || btoa(pass) !== folder.passwordHash) {
                        showToast("Senha incorreta");
                        return;
                    }
                }
            }
        }
    }

    window.currentNoteId = id;
    let note = window.notes.find(n => n.id === id);

    // If note not found in memory, look for it in workspaceFiles (it's a file reference)
    if (!note) {
        const wsId = window.currentWorkspaceId;
        const file = (window.workspaceFiles[wsId] || []).find(f => f.id === id);

        if (file && file.handle) {
            try {
                showToast('Carregando arquivo do disco...');
                const fileObj = await file.handle.getFile();
                const content = await fileObj.text();

                // Create note from file
                note = {
                    id: file.id,
                    title: file.name.replace('.md', ''),
                    content: content,
                    category: 'Disco',
                    date: new Date(fileObj.lastModified).toISOString(),
                    location: { workspaceId: wsId, folderId: file.id },
                    fileHandle: file.handle
                };

                // Add to notes array for future access
                window.notes.push(note);
                saveData();
                showToast('Arquivo carregado!');
            } catch (e) {
                console.error('[Editor] Error loading file:', e);
                showToast('Erro ao carregar arquivo. Reconecte a pasta.');
                return;
            }
        } else {
            showToast('Nota não encontrada');
            return;
        }
    }

    document.getElementById('modal-title-input').value = note.title;
    document.getElementById('modal-textarea').value = note.content;

    // Store original content for save button state tracking
    window.originalNoteTitle = note.title;
    window.originalNoteContent = note.content;

    setEditorMode('preview');
    document.getElementById('preview-modal').classList.remove('hidden');
    document.getElementById('preview-modal').classList.add('flex');

    // Location Logic
    const label = document.getElementById('current-location-label');
    if (label) {
        if (note.location) {
            const ws = window.workspaces.find(w => w.id === note.location.workspaceId);

            // Find folder - search in workspaceFiles first level
            let folder = null;
            const wsFiles = window.workspaceFiles[note.location.workspaceId] || [];

            if (note.location.folderId) {
                // First, try to find a folder with matching ID
                folder = wsFiles.find(f => f.id === note.location.folderId && f.type === 'folder');

                // If not found, maybe it's the folder that contains the file
                if (!folder) {
                    // Search for folder that contains a child with matching ID
                    folder = wsFiles.find(f =>
                        f.type === 'folder' &&
                        f.children?.some(c => c.id === note.location.folderId)
                    );
                }
            }

            const folderName = folder ? folder.name : '/';
            if (ws) label.innerText = `${ws.name} > ${folderName}`;
            else label.innerText = 'Sem local';
        } else {
            label.innerText = 'Sem local';
        }
    }

    updateStats();
    updateSaveButtonState();

    // Update category label
    if (typeof updateCategoryLabel === 'function') {
        updateCategoryLabel();
    }

    // Add event listeners for change tracking
    const titleInput = document.getElementById('modal-title-input');
    const textarea = document.getElementById('modal-textarea');

    // Remove old listeners to avoid duplicates
    titleInput.removeEventListener('input', updateSaveButtonState);
    textarea.removeEventListener('input', updateSaveButtonState);

    // Add new listeners
    titleInput.addEventListener('input', updateSaveButtonState);
    textarea.addEventListener('input', updateSaveButtonState);
}

function closePreview() {
    document.getElementById('preview-modal').classList.add('hidden');
    document.getElementById('preview-modal').classList.remove('flex');
    if (isFullscreen) toggleFullscreen();
    renderNotes();
    // Atualizar conteúdo do canvas se estiver aberto
    if (document.getElementById('view-canvas').classList.contains('active')) initCanvas();
}

function updatePreviewRender() {
    const text = document.getElementById('modal-textarea').value;
    const target = document.getElementById('modal-content-rendered');
    let html = text
        .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-zinc-100 mb-6 mt-2 pb-2 border-b border-zinc-800">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold text-zinc-100 mb-4 mt-8">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-medium text-zinc-200 mb-3 mt-6">$1</h3>')
        .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 py-1 my-4 text-zinc-400 italic bg-zinc-900/30 rounded-r">$1</blockquote>')
        .replace(/```([^`]+)```/gim, '<pre class="bg-[#121214] p-4 rounded-lg border border-zinc-800 text-sm text-zinc-300 overflow-x-auto my-4 font-mono shadow-inner"><code>$1</code></pre>')
        .replace(/`([^`]+)`/gim, '<code class="bg-zinc-800/50 px-1.5 py-0.5 rounded text-zinc-300 font-mono text-xs border border-zinc-700/50">$1</code>')
        .replace(/\*\*(.*)\*\*/gim, '<strong class="text-zinc-100 font-semibold">$1</strong>')
        .replace(/\*(.*)\*/gim, '<em class="text-zinc-400">$1</em>')
        .replace(/- \[x\] (.*$)/gim, '<div class="flex items-center gap-3 my-1 opacity-60"><i data-lucide="check-square" class="w-4 h-4 text-emerald-500"></i> <span class="line-through text-zinc-500">$1</span></div>')
        .replace(/- \[ \] (.*$)/gim, '<div class="flex items-center gap-3 my-1"><i data-lucide="square" class="w-4 h-4 text-zinc-600"></i> <span class="text-zinc-300">$1</span></div>')
        .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc marker:text-zinc-600 pl-1 mb-1 text-zinc-300">$1</li>')
        .replace(/\n$/gim, '<br />');
    target.innerHTML = html || '<p class="text-zinc-600 italic text-center mt-20">Comece a escrever...</p>';
    if (window.lucide) lucide.createIcons();
    updateStats();
}

function updateStats() {
    const text = document.getElementById('modal-textarea').value;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const chars = text.length;
    document.getElementById('word-count').innerText = `${words} palavras`;
    document.getElementById('char-count').innerText = `${chars} caracteres`;
}

async function saveCurrentNote() {
    const title = document.getElementById('modal-title-input').value;
    const content = document.getElementById('modal-textarea').value;

    // Save to Memory
    if (window.currentNoteId) {
        const noteIndex = window.notes.findIndex(n => n.id === window.currentNoteId);
        if (noteIndex > -1) {
            window.notes[noteIndex].title = title;
            window.notes[noteIndex].content = content;
            notes[noteIndex].date = new Date().toISOString();

            // CHECK IF LOCAL FILE - Save to disk if note has fileHandle or workspace has handle
            const note = window.notes[noteIndex];
            console.log('[Editor] Note location:', note.location);
            console.log('[Editor] FSHandler.handles:', FSHandler.handles);

            if (note.location && note.location.workspaceId) {
                const ws = window.workspaces.find(w => w.id === note.location.workspaceId);
                const wsHandle = FSHandler.handles[note.location.workspaceId];
                console.log('[Editor] Workspace:', ws?.name, '| Handle exists:', !!wsHandle);

                // Check if note has fileHandle or workspace has directory handle
                if (note.fileHandle || wsHandle) {
                    showToast('Salvando no disco...');

                    // Check for file name change (rename scenario)
                    // Search in root AND inside children of folders (mounted folders have children)
                    let fileInWs = (window.workspaceFiles[ws.id] || []).find(f => f.id === note.id);

                    // If not found in root, search inside children of mounted folders
                    if (!fileInWs) {
                        for (const folder of (window.workspaceFiles[ws.id] || [])) {
                            if (folder.children && Array.isArray(folder.children)) {
                                fileInWs = folder.children.find(f => f.id === note.id);
                                if (fileInWs) break;
                            }
                        }
                    }

                    const oldFilename = fileInWs ? fileInWs.name : null;
                    const newFilename = (title || 'Sem título').replace(/[^a-zA-Z0-9À-ÿ\s-_]/g, '') + '.md';
                    const isRename = oldFilename && oldFilename !== newFilename;

                    console.log('[Editor] Old filename:', oldFilename, '| New filename:', newFilename, '| Is rename:', isRename);

                    if (isRename && wsHandle) {
                        // RENAME: Create new file, delete old, update references
                        try {
                            // 1. Create new file with new name
                            const newHandle = await wsHandle.getFileHandle(newFilename, { create: true });
                            await FSHandler.saveFile(newHandle, content);

                            // 2. Delete old file
                            await wsHandle.removeEntry(oldFilename);

                            // 3. Update references
                            if (fileInWs) {
                                fileInWs.name = newFilename;
                                fileInWs.handle = newHandle;
                            }
                            note.fileHandle = newHandle;

                            console.log('[Editor] File renamed successfully:', oldFilename, '->', newFilename);
                            showToast('Arquivo renomeado e salvo no disco!');
                        } catch (e) {
                            console.error('[Editor] Error renaming file:', e);
                            showToast('Erro ao renomear arquivo: ' + e.message);
                        }
                    } else {
                        // NORMAL SAVE: Just update content
                        const filename = oldFilename || newFilename;
                        console.log('[Editor] Filename to save:', filename);

                        const freshHandle = await FSHandler.getFileHandle(ws.id, filename);
                        console.log('[Editor] Fresh handle resolved:', !!freshHandle);

                        if (freshHandle) {
                            const success = await FSHandler.saveFile(freshHandle, content);
                            if (success) {
                                showToast('Arquivo atualizado no disco!');
                                note.fileHandle = freshHandle;
                            }
                        } else {
                            console.warn('[Editor] Could not resolve fresh handle for note:', note.id);
                            showToast('Reconecte a pasta para salvar no disco.');
                        }
                    }
                }
            } else {
                console.log('[Editor] Note has no location - saving to localStorage only');
            }
        }
    }
    showToast('Nota salva com sucesso');
    saveData(); // Persist changes
    saveCanvasLayout();

    // Update original content to current (so button becomes disabled again)
    window.originalNoteTitle = document.getElementById('modal-title-input').value;
    window.originalNoteContent = document.getElementById('modal-textarea').value;
    updateSaveButtonState();
}

function quickSaveNote() {
    const titleInput = document.getElementById('quick-title');
    const contentInput = document.getElementById('quick-content');
    if (!titleInput.value.trim() && !contentInput.value.trim()) return;
    const newNote = {
        id: Date.now(),
        title: titleInput.value || 'Nota Sem Título',
        content: contentInput.value || '',
        category: 'Geral',
        date: new Date().toISOString(),
        location: window.currentWorkspaceId ? { workspaceId: window.currentWorkspaceId } : undefined
    };
    window.notes.push(newNote);
    renderNotes();
    titleInput.value = '';
    contentInput.value = '';
    showToast('Nota criada rapidamente');
    saveData(); // Persist changes
    if (document.getElementById('view-canvas').classList.contains('active')) initCanvas();
}

function deleteCurrentNote() {
    if (!window.currentNoteId) return;

    const note = window.notes.find(n => n.id === window.currentNoteId);
    if (!note) {
        console.error('Note not found in memory');
        return;
    }

    // Try to find workspace linkage
    let wsId = null;
    let fileId = null;
    let fileExistsInWorkspace = false;

    // 1. Explicit Location
    if (note.location && note.location.workspaceId) {
        wsId = note.location.workspaceId;
        // Check if file actually exists in workspaceFiles
        const file = window.workspaceFiles[wsId]?.find(f => f.id === note.id);
        if (file) {
            fileId = file.id;
            fileExistsInWorkspace = true;
        }
    }

    // 2. Implicit Location (Search in all workspaces)
    if (!fileExistsInWorkspace) {
        for (const w of window.workspaces) {
            const f = window.workspaceFiles[w.id]?.find(file => file.id === note.id);
            if (f) {
                wsId = w.id;
                fileId = f.id;
                fileExistsInWorkspace = true;
                break;
            }
        }
    }

    // 3. Check by fileHandle match
    if (!fileExistsInWorkspace && note.fileHandle) {
        for (const w of window.workspaces) {
            const f = window.workspaceFiles[w.id]?.find(file => file.handle === note.fileHandle);
            if (f) {
                wsId = w.id;
                fileId = f.id;
                fileExistsInWorkspace = true;
                break;
            }
        }
    }

    // Use triggerDeleteFile if file exists in workspace, otherwise use triggerDeleteNote for virtual notes
    if (fileExistsInWorkspace && typeof triggerDeleteFile === 'function') {
        triggerDeleteFile(wsId, fileId);
    } else {
        // Virtual note - use the same modal but customized
        triggerDeleteNote(note);
    }
}

// Modal for virtual notes (notes without workspace file linkage)
window.pendingDeleteNoteId = null;

function triggerDeleteNote(note) {
    window.pendingDeleteNoteId = note.id;
    // Clear workspace delete state
    if (typeof window.pendingDeleteWsId !== 'undefined') window.pendingDeleteWsId = null;
    if (typeof window.pendingDeleteFileId !== 'undefined') window.pendingDeleteFileId = null;

    const modal = document.getElementById('delete-modal');
    const nameEl = document.getElementById('delete-filename');
    const deleteDiskBtn = document.getElementById('btn-delete-disk');

    if (nameEl) nameEl.innerText = note.title || 'Nota sem título';

    // Hide "Delete from disk" for virtual notes (they don't have files)
    if (deleteDiskBtn) {
        deleteDiskBtn.style.display = 'none';
    }

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function confirmDeleteNoteAction() {
    if (!window.pendingDeleteNoteId) return;

    const noteId = window.pendingDeleteNoteId;

    // Remove from notes
    window.notes = window.notes.filter(n => n.id !== noteId);

    // Clean up canvas positions
    if (typeof canvasState !== 'undefined' && canvasState.positions) {
        delete canvasState.positions[noteId];
        if (typeof saveCanvasLayout === 'function') saveCanvasLayout();
    }

    saveData();
    closePreview();
    renderNotes();
    closeDeleteModal(); // This will clear the window var
    showToast('Nota excluída.');
}

