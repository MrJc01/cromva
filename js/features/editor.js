// --- EDITOR LOGIC ---

function renderNotes() {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const sortedNotes = [...notes].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedNotes.forEach(note => {
        const date = new Date(note.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const preview = note.content.substring(0, 120).replace(/[#*`>]/g, '') + '...';

        const card = document.createElement('div');
        card.className = 'glass p-5 rounded-xl cursor-pointer hover:border-zinc-500 hover:shadow-2xl hover:shadow-zinc-900/50 transition-all duration-300 hover:-translate-y-1 group flex flex-col h-48 relative border-zinc-800';
        card.onclick = () => openPreview(note.id);
        card.innerHTML = `
                    <div class="flex justify-between items-start mb-3">
                        <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest border border-zinc-800 px-2 py-0.5 rounded bg-zinc-900/50">${note.category}</span>
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="arrow-up-right" class="w-4 h-4 text-zinc-500 hover:text-zinc-200"></i></div>
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
    const recents = notes.slice(0, 5);
    count.innerText = notes.length;
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

function openPreview(id) {
    currentNoteId = id;
    const note = notes.find(n => n.id === id);
    document.getElementById('modal-title-input').value = note.title;
    document.getElementById('modal-textarea').value = note.content;
    setEditorMode('preview');
    document.getElementById('preview-modal').classList.remove('hidden');
    document.getElementById('preview-modal').classList.add('flex');

    // Location Logic
    const label = document.getElementById('current-location-label');
    if (label) {
        if (note.location) {
            const ws = workspaces.find(w => w.id === note.location.workspaceId);
            const folder = note.location.folderId
                ? (workspaceFiles[note.location.workspaceId] || []).find(f => f.id === note.location.folderId)
                : { name: '/' };
            if (ws) label.innerText = `${ws.name} > ${folder ? folder.name : 'Unknown'}`;
            else label.innerText = 'Sem local';
        } else {
            label.innerText = 'Sem local';
        }
    }

    updateStats();
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
    if (currentNoteId) {
        const noteIndex = notes.findIndex(n => n.id === currentNoteId);
        if (noteIndex > -1) {
            notes[noteIndex].title = title;
            notes[noteIndex].content = content;
            notes[noteIndex].date = new Date().toISOString();

            // CHECK IF LOCAL FILE
            const note = notes[noteIndex];
            if (note.fileHandle) {
                showToast('Salvando no disco...');
                const success = await FSHandler.saveFile(note.fileHandle, content);
                if (success) showToast('Arquivo atualizado no disco!');
            }
        }
    }
    showToast('Nota salva com sucesso');
    saveCanvasLayout();
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
        date: new Date().toISOString()
    };
    notes.push(newNote);
    renderNotes();
    titleInput.value = '';
    contentInput.value = '';
    showToast('Nota criada rapidamente');
    if (document.getElementById('view-canvas').classList.contains('active')) initCanvas();
}
