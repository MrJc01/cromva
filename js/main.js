lucide.createIcons();

// --- DADOS INICIAIS ---
let notes = [
    { id: 1, title: 'Bem-vindo ao Cromva', content: '# Introdução\nBem-vindo ao **Cromva OS**. Este é um sistema de organização local-first.\n\n## Funcionalidades\n- [x] Editor Markdown Híbrido\n- [x] Grafo de Conexões\n- [ ] Sincronização P2P\n\n> "A simplicidade é o último grau de sofisticação."\n\nExperimente editar esta nota ou criar uma nova usando a barra superior.', category: 'Sistema', date: new Date().toISOString() },
    { id: 2, title: 'Planejamento Q3', content: '### Metas Principais\n1. Refatorar a API de Graph\n2. Melhorar performance do Canvas\n\n`const goal = "ship it";`\n\nVerificar documentação do D3.js para o grafo.', category: 'Trabalho', date: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, title: 'Ideias de Design', content: 'Inspirado no **Linear**, **Obsidian** e **Notion**.\nUtilizar tons de Zinco (Tailwind) para manter a neutralidade visual.\n\n- Zinco 950 para background\n- Zinco 800 para bordas\n- Zinco 100 para texto principal', category: 'Design', date: new Date(Date.now() - 172800000).toISOString() },
    { id: 4, title: 'Novo Algoritmo', content: 'Implementar busca vetorial local usando WebAssembly.', category: 'Sistema', date: new Date(Date.now() - 200000000).toISOString() },
    { id: 5, title: 'Sprint Review', content: 'Preparar slides para a review de sexta-feira.', category: 'Trabalho', date: new Date(Date.now() - 30000000).toISOString() }
];

// --- WORKSPACES DATA ---
const workspaces = [
    { id: 1, name: 'Inicial Padrão', desc: 'Workspace principal do sistema', color: 'blue', date: new Date().toISOString() },
    { id: 2, name: 'Cromva Dev', desc: 'Ambiente de desenvolvimento', color: 'emerald', date: new Date(Date.now() - 100000000).toISOString() }
];

const workspaceFiles = {
    1: [
        { id: 101, name: 'index.html', type: 'file', size: '15 KB', status: 'visible', locked: false },
        { id: 102, name: 'styles.css', type: 'file', size: '4 KB', status: 'visible', locked: false },
        { id: 103, name: 'assets', type: 'folder', size: '-', status: 'visible', locked: false },
        { id: 104, name: 'secret-docs', type: 'folder', size: '-', status: 'visible', locked: true }, // Locked folder
        { id: 105, name: 'legacy', type: 'folder', size: '-', status: 'hidden', locked: false }
    ],
    2: [
        { id: 201, name: 'main.rs', type: 'file', size: '22 KB', status: 'visible', locked: false },
        { id: 202, name: 'Cargo.toml', type: 'file', size: '1 KB', status: 'visible', locked: false }
    ]
};

// --- GLOBAL STATE ---
let currentWorkspaceId = workspaces[0].id;
let isSidebarHidden = false;
let currentView = 'home';

// --- SETTINGS STATE ---
const defaultSettings = {
    providers: {
        math: true,
        file: true,
        wiki: true,
        convert: true,
        time: true,
        weather: true,
        synonym: true
    },
    customEngines: [
        { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={text}' },
        { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/results?search_query={text}' }
    ]
};

window.cromvaSettings = JSON.parse(localStorage.getItem('cromvaSettings')) || defaultSettings;

function saveSettings() {
    localStorage.setItem('cromvaSettings', JSON.stringify(window.cromvaSettings));
}

let currentNoteId = null;
let isFullscreen = false;

// --- RENDER GRID ---
function renderNotes() {
    const grid = document.getElementById('notes-grid');
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
    lucide.createIcons();
    renderRecents();
}

function renderRecents() {
    const list = document.getElementById('recent-list');
    const count = document.getElementById('recent-count');
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
    lucide.createIcons();
}

// --- NAVIGATION ---
function switchView(viewId) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-zinc-800/50', 'text-zinc-100', 'border', 'border-zinc-700/50');
        btn.classList.add('text-zinc-400');
    });
    const activeBtn = document.getElementById(`nav-${viewId}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-zinc-800/50', 'text-zinc-100', 'border', 'border-zinc-700/50');
        activeBtn.classList.remove('text-zinc-400');
    }
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`view-${viewId}`).classList.add('active');

    // Logic de entrada
    if (viewId === 'graph') {
        setTimeout(initGraph, 100);
    } else {
        if (graphAnimationId) cancelAnimationFrame(graphAnimationId);
        if (graphResizeHandler) { window.removeEventListener('resize', graphResizeHandler); graphResizeHandler = null; }
    }

    if (viewId === 'canvas') {
        setTimeout(initCanvas, 50);
    }
}

// --- SIDEBAR TOGGLE ---
// --- SIDEBAR TOGGLE ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // Toggle classes for animation
    sidebar.classList.toggle('w-64');
    sidebar.classList.toggle('w-0');
    sidebar.classList.toggle('overflow-hidden');
    sidebar.classList.toggle('border-r'); // Hide border when collapsed
    sidebar.classList.toggle('opacity-0'); // Fade out content
    sidebar.classList.toggle('p-0'); // Remove padding from container to avoid width issues

    // Recalcular layout se necessário (ex: grafo)
    if (document.getElementById('view-graph').classList.contains('active')) {
        setTimeout(initGraph, 300); // 300ms matches transition duration
    }
}

// --- EDITOR LOGIC ---
function setEditorMode(mode) {
    const paneEdit = document.getElementById('pane-edit');
    const panePreview = document.getElementById('pane-preview');
    document.querySelectorAll('[id^="btn-mode-"]').forEach(btn => btn.classList.remove('editor-mode-active', 'text-zinc-200'));
    const activeBtn = document.getElementById(`btn-mode-${mode}`);
    activeBtn.classList.add('editor-mode-active', 'text-zinc-200');
    activeBtn.classList.remove('text-zinc-400');
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

function toggleFullscreen() {
    const container = document.getElementById('modal-container');
    isFullscreen = !isFullscreen;
    if (isFullscreen) container.classList.add('modal-fullscreen');
    else container.classList.remove('modal-fullscreen');
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
    lucide.createIcons();
    updateStats();
}

function updateStats() {
    const text = document.getElementById('modal-textarea').value;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const chars = text.length;
    document.getElementById('word-count').innerText = `${words} palavras`;
    document.getElementById('char-count').innerText = `${chars} caracteres`;
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-msg');
    msgEl.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function saveCurrentNote() {
    const title = document.getElementById('modal-title-input').value;
    const content = document.getElementById('modal-textarea').value;
    if (currentNoteId) {
        const noteIndex = notes.findIndex(n => n.id === currentNoteId);
        if (noteIndex > -1) {
            notes[noteIndex].title = title;
            notes[noteIndex].content = content;
            notes[noteIndex].date = new Date().toISOString();
        }
    }
    showToast('Nota salva com sucesso');
    saveCanvasLayout(); // Salva layout se houver mudanças de conteúdo que afetem tamanho (futuro)
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
    // Se estiver no canvas, recarregar para aparecer
    if (document.getElementById('view-canvas').classList.contains('active')) initCanvas();
}

// --- GRAPH ENGINE ---
let graphAnimationId = null;
let graphNodes = [];
let globalHoveredNode = null;
let canvasMouseMoveHandler = null;
let canvasClickHandler = null;
let graphResizeHandler = null;

function initGraph() {
    const canvas = document.getElementById('graph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const tooltip = document.getElementById('graph-tooltip');
    if (graphAnimationId) cancelAnimationFrame(graphAnimationId);
    graphNodes = [];
    globalHoveredNode = null;
    if (graphResizeHandler) { window.removeEventListener('resize', graphResizeHandler); }
    graphResizeHandler = () => {
        const parent = canvas.parentElement;
        if (canvas && parent) { canvas.width = parent.offsetWidth; canvas.height = parent.offsetHeight; }
    };
    window.addEventListener('resize', graphResizeHandler);
    graphResizeHandler();

    const getColor = (cat) => {
        if (cat === 'Sistema') return '#3b82f6';
        if (cat === 'Trabalho') return '#10b981';
        if (cat === 'Design') return '#f59e0b';
        return '#71717a';
    };

    graphNodes = notes.map(n => ({
        id: n.id, title: n.title, category: n.category, x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: 8, color: getColor(n.category), vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4
    }));

    if (canvasMouseMoveHandler) canvas.removeEventListener('mousemove', canvasMouseMoveHandler);
    if (canvasClickHandler) canvas.removeEventListener('click', canvasClickHandler);

    canvasMouseMoveHandler = (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        let found = null;
        for (let node of graphNodes) {
            const dist = Math.sqrt((mouseX - node.x) ** 2 + (mouseY - node.y) ** 2);
            if (dist < node.radius + 15) { found = node; break; }
        }
        globalHoveredNode = found;
        if (found) {
            canvas.style.cursor = 'pointer'; tooltip.classList.remove('hidden'); tooltip.style.left = `${mouseX + 20}px`; tooltip.style.top = `${mouseY + 20}px`;
            document.getElementById('tooltip-title').innerText = found.title; document.getElementById('tooltip-cat').innerText = found.category; tooltip.style.borderLeftColor = found.color;
        } else {
            canvas.style.cursor = 'crosshair'; tooltip.classList.add('hidden');
        }
    };
    canvasClickHandler = (e) => { if (globalHoveredNode) openPreview(globalHoveredNode.id); };
    canvas.addEventListener('mousemove', canvasMouseMoveHandler);
    canvas.addEventListener('click', canvasClickHandler);

    function animate() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < graphNodes.length; i++) {
            let node = graphNodes[i];
            if (!globalHoveredNode) {
                node.x += node.vx; node.y += node.vy;
                if (node.x < 10 || node.x > canvas.width - 10) node.vx *= -1; if (node.y < 10 || node.y > canvas.height - 10) node.vy *= -1;
            }
        }
        ctx.lineWidth = 1;
        for (let i = 0; i < graphNodes.length; i++) {
            let nodeA = graphNodes[i];
            for (let j = i + 1; j < graphNodes.length; j++) {
                let nodeB = graphNodes[j];
                if (nodeA.category === nodeB.category) {
                    const dist = Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);
                    if (dist < 250) {
                        ctx.beginPath(); ctx.moveTo(nodeA.x, nodeA.y); ctx.lineTo(nodeB.x, nodeB.y); const alpha = 1 - (dist / 250); ctx.strokeStyle = nodeA.color + Math.floor(alpha * 50).toString(16).padStart(2, '0'); ctx.stroke();
                    }
                }
            }
        }
        for (let node of graphNodes) {
            ctx.beginPath(); const isHovered = globalHoveredNode && globalHoveredNode.id === node.id;
            if (isHovered) { ctx.arc(node.x, node.y, node.radius * 1.5, 0, Math.PI * 2); ctx.shadowBlur = 15; ctx.shadowColor = node.color; ctx.fillStyle = '#fff'; }
            else { ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2); ctx.shadowBlur = 0; ctx.fillStyle = node.color; }
            ctx.fill(); ctx.shadowBlur = 0;
        }
        if (document.getElementById('view-graph').classList.contains('active')) { graphAnimationId = requestAnimationFrame(animate); }
    }
    animate();
}

// --- INFINITE CANVAS ENGINE (MIRO STYLE) ---
let canvasState = {
    scale: 1,
    x: -1500, // Centralizar inicialmente no espaço de 5000px
    y: -1500,
    positions: {} // { noteId: {x, y} }
};

// Carregar do LocalStorage
const savedState = localStorage.getItem('cromva_canvas_state');
if (savedState) {
    try {
        const parsed = JSON.parse(savedState);
        canvasState = { ...canvasState, ...parsed };
    } catch (e) { console.error('Erro ao carregar canvas state', e); }
}

function saveCanvasLayout() {
    localStorage.setItem('cromva_canvas_state', JSON.stringify(canvasState));
}

function initCanvas() {
    const container = document.getElementById('infinite-canvas');
    container.innerHTML = '';

    // Aplicar transformações iniciais
    updateCanvasTransform();

    // Gerar Cards
    // Lógica de Agrupamento Automático se não houver posição salva
    const categories = {};
    notes.forEach(note => {
        if (!categories[note.category]) categories[note.category] = [];
        categories[note.category].push(note);
    });

    let colIndex = 0;
    const startX = 2000; // Posição inicial no mundo 5000x5000
    const startY = 2000;
    const colWidth = 320;
    const rowHeight = 250;

    notes.forEach(note => {
        // Verificar se existe posição salva
        let posX, posY;
        if (canvasState.positions[note.id]) {
            posX = canvasState.positions[note.id].x;
            posY = canvasState.positions[note.id].y;
        } else {
            // Calcular posição baseada na categoria (Auto Layout)
            // Encontrar índice da categoria e índice dentro da categoria
            const cats = Object.keys(categories);
            const cIdx = cats.indexOf(note.category);
            const nIdx = categories[note.category].indexOf(note);

            posX = startX + (cIdx * colWidth);
            posY = startY + (nIdx * rowHeight) + 50; // +50 para caber o título da coluna

            // Salvar posição inicial
            canvasState.positions[note.id] = { x: posX, y: posY };
        }

        const nodeEl = document.createElement('div');
        nodeEl.className = 'canvas-node glass rounded-lg border-l-4 group shadow-xl bg-zinc-900/80 backdrop-blur-md';
        // Cor da borda baseada na categoria
        const colors = { 'Sistema': 'border-l-blue-500', 'Trabalho': 'border-l-emerald-500', 'Design': 'border-l-amber-500' };
        nodeEl.classList.add(colors[note.category] || 'border-l-zinc-500');

        nodeEl.style.left = `${posX}px`;
        nodeEl.style.top = `${posY}px`;
        nodeEl.setAttribute('data-id', note.id);

        // Conteúdo
        const previewText = note.content.substring(0, 80).replace(/[#*`>]/g, '') + '...';
        nodeEl.innerHTML = `
                    <div class="canvas-node-header p-3 pb-1 flex justify-between items-center cursor-move border-b border-zinc-800/50">
                        <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">${note.category}</span>
                        <i data-lucide="grip-horizontal" class="w-4 h-4 text-zinc-600 opacity-50 group-hover:opacity-100"></i>
                    </div>
                    <div class="p-4 pt-2 cursor-default" onmousedown="event.stopPropagation()">
                        <h4 class="font-bold text-zinc-200 text-sm mb-2 truncate">${note.title}</h4>
                        <p class="text-[11px] text-zinc-400 leading-relaxed h-10 overflow-hidden">${previewText}</p>
                        <button onclick="openPreview(${note.id})" class="mt-2 text-[10px] text-blue-400 hover:text-blue-300 hover:underline">Abrir Nota</button>
                    </div>
                `;

        // Drag Logic para a Nota
        const header = nodeEl.querySelector('.canvas-node-header');
        header.addEventListener('mousedown', (e) => startDragNode(e, nodeEl, note.id));

        container.appendChild(nodeEl);
    });

    // Adicionar Títulos de Colunas (Visual apenas, não interativo) se for primeira vez
    const cats = Object.keys(categories);
    cats.forEach((cat, idx) => {
        // Tenta achar a posição X média das notas dessa categoria ou usa o padrão
        const label = document.createElement('div');
        label.className = 'absolute text-zinc-500 font-bold uppercase tracking-[0.2em] text-lg opacity-50 pointer-events-none';
        label.innerText = cat;
        label.style.top = `${startY}px`; // Acima da primeira nota
        label.style.left = `${startX + (idx * colWidth)}px`;
        container.appendChild(label);
    });

    saveCanvasLayout();
    lucide.createIcons();
}

// --- CANVAS INTERACTIONS ---
const canvasContainer = document.getElementById('view-canvas');
const infiniteCanvas = document.getElementById('infinite-canvas');
let isPanning = false;
let startPanX, startPanY;

// Panning do Fundo
canvasContainer.addEventListener('mousedown', (e) => {
    // Só inicia Pan se clicar no fundo (não em uma nota)
    if (e.target === canvasContainer || e.target === infiniteCanvas) {
        isPanning = true;
        startPanX = e.clientX - canvasState.x;
        startPanY = e.clientY - canvasState.y;
        infiniteCanvas.classList.add('panning');
    }
});

window.addEventListener('mousemove', (e) => {
    if (isPanning) {
        e.preventDefault();
        canvasState.x = e.clientX - startPanX;
        canvasState.y = e.clientY - startPanY;
        updateCanvasTransform();
    }
});

window.addEventListener('mouseup', () => {
    if (isPanning) {
        isPanning = false;
        infiniteCanvas.classList.remove('panning');
        saveCanvasLayout();
    }
});

// Drag de Notas
function startDragNode(e, el, id) {
    e.stopPropagation(); // Impede Pan do canvas
    e.preventDefault();

    let startX = e.clientX;
    let startY = e.clientY;
    let startLeft = parseInt(el.style.left || 0);
    let startTop = parseInt(el.style.top || 0);

    el.classList.add('dragging');

    function moveNode(e) {
        // Considerar o Zoom (scale) no movimento
        const dx = (e.clientX - startX) / canvasState.scale;
        const dy = (e.clientY - startY) / canvasState.scale;

        const newX = startLeft + dx;
        const newY = startTop + dy;

        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
    }

    function stopDragNode() {
        el.classList.remove('dragging');
        window.removeEventListener('mousemove', moveNode);
        window.removeEventListener('mouseup', stopDragNode);

        // Salvar nova posição
        canvasState.positions[id] = {
            x: parseInt(el.style.left),
            y: parseInt(el.style.top)
        };
        saveCanvasLayout();
    }

    window.addEventListener('mousemove', moveNode);
    window.addEventListener('mouseup', stopDragNode);
}

// Zoom Logic
function updateCanvasTransform() {
    infiniteCanvas.style.transform = `translate(${canvasState.x}px, ${canvasState.y}px) scale(${canvasState.scale})`;
    document.getElementById('zoom-level').innerText = `${Math.round(canvasState.scale * 100)}%`;
}

function adjustZoom(delta) {
    canvasState.scale += delta;
    if (canvasState.scale < 0.2) canvasState.scale = 0.2;
    if (canvasState.scale > 3) canvasState.scale = 3;
    updateCanvasTransform();
    saveCanvasLayout();
}

function resetZoom() {
    canvasState.scale = 1;
    updateCanvasTransform();
    saveCanvasLayout();
}

// Zoom com Wheel (Ctrl + Scroll ou Scroll normal no Miro)
canvasContainer.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        adjustZoom(delta);
    }
});

// --- GLOBAL LISTENERS ---
document.getElementById('modal-textarea').addEventListener('input', updatePreviewRender);
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!document.getElementById('preview-modal').classList.contains('hidden')) saveCurrentNote();
    }
});

window.onload = () => { renderNotes(); };

// --- WORKSPACE MANAGER ENGINE ---
// --- WORKSPACE MANAGER ENGINE ---
// Workspaces moved to top to avoid ReferenceError


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

    // Enter key support
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
    workspaceFiles[newId] = []; // Empty start
    renderWorkspaces();
    showToast('Workspace criado com sucesso');

    // Close modal
    document.getElementById('new-workspace-modal').classList.add('hidden');
    document.getElementById('new-workspace-modal').classList.remove('flex');
}

function renderWorkspaces() {
    const list = document.getElementById('workspace-list');
    list.innerHTML = '';

    // Tailwind Color Map to ensure classes are generated correctly
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
        // Card Styling
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
    lucide.createIcons();
}

function switchWorkspace(id) {
    currentWorkspaceId = id;
    renderWorkspaces();
    renderExplorer(id);
    showToast(`Workspace alterado para ${workspaces.find(w => w.id === id).name}`);
}

// --- EXPLORER LOGIC ---
function renderExplorer(wsId) {
    const workspace = workspaces.find(w => w.id === wsId);
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
        lucide.createIcons();
        return;
    }

    files.forEach(file => {
        const row = document.createElement('div');
        row.className = `grid grid-cols-12 px-4 py-3 border-b border-zinc-800/30 hover:bg-zinc-900/50 items-center text-xs group transition-colors ${file.status === 'hidden' ? 'opacity-50 grayscale' : ''}`;

        // Icon logic
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
            </div>
        `;

        // Lock interaction
        if (file.locked) {
            row.ondblclick = () => {
                const pass = prompt("Digite a senha para acessar esta pasta:");
                if (pass === '1234') { // Mock password
                    showToast("Acesso concedido");
                } else {
                    showToast("Senha incorreta");
                }
            };
        }

        list.appendChild(row);
    });
    lucide.createIcons();
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
            if (pass) { // Mock: any password unlocks for toggle, specific logic can be stricter
                file.locked = false;
                showToast("Pasta destrancada");
            }
        }
        renderExplorer(wsId);
    }
}

// --- SETTINGS PANEL ENGINE ---
function openSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('settings-modal').classList.add('flex');
    switchSettingsTab('general'); // Default tab
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
    document.getElementById('settings-modal').classList.remove('flex');
}

function switchSettingsTab(tabId) {
    // 1. Sidebar Buttons State
    document.querySelectorAll('.settings-tab').forEach(btn => {
        btn.classList.remove('bg-zinc-800/50', 'text-zinc-100', 'border', 'border-zinc-700/50');
        btn.classList.add('text-zinc-400');
    });
    const activeBtn = document.getElementById(`tab-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-zinc-800/50', 'text-zinc-100', 'border', 'border-zinc-700/50');
        activeBtn.classList.remove('text-zinc-400');
    }

    // 2. Content Sections State
    document.querySelectorAll('.settings-content').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(`settings-${tabId}`).classList.remove('hidden');

    // 3. Update Header Title
    const titles = {
        'general': 'Geral',
        'appearance': 'Aparência',
        'system': 'Sistema',
        'backup': 'Dados & Backup',
        'search': 'Busca & Inteligência'
    };
    document.getElementById('settings-title').innerText = titles[tabId];

    if (tabId === 'search') renderSearchSettings();
}

function checkForUpdates() {
    const btn = document.getElementById('btn-update');
    const originalText = btn.innerHTML;

    // Simulate Loading
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Verificando...`;
    lucide.createIcons();

    setTimeout(() => {
        btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-500"></i> Tudo atualizado`;
        lucide.createIcons();
        showToast("Você já tem a versão mais recente");

        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = originalText;
            lucide.createIcons();
        }, 3000);
    }, 2000);
}

function triggerBackup() {
    // Mock Data Export
    const data = {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        notes: notes,
        workspaces: workspaces,
        files: workspaceFiles
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "cromva_backup_" + Date.now() + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    showToast("Backup iniciado...");
}

// --- SEARCH SETTINGS LOGIC ---
function renderSearchSettings() {
    // 1. Providers List
    const pList = document.getElementById('providers-list');
    pList.innerHTML = '';
    const labels = {
        math: 'Calculadora (Math)',
        file: 'Arquivos do Workspace',
        wiki: 'Wikipédia',
        convert: 'Conversor de Unidades',
        time: 'Fuso Horário',
        weather: 'Clima (OpenMeteo)',
        synonym: 'Sinônimos (Datamuse)'
    };

    Object.keys(window.cromvaSettings.providers).forEach(key => {
        const isEnabled = window.cromvaSettings.providers[key];
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between py-2 bg-zinc-900/30 px-3 rounded-lg border border-zinc-800/50';
        item.innerHTML = `
            <span class="text-sm text-zinc-300 font-medium">${labels[key] || key}</span>
            <div onclick="toggleProvider('${key}')" class="w-9 h-5 ${isEnabled ? 'bg-blue-600' : 'bg-zinc-700'} rounded-full relative cursor-pointer transition-colors">
                <div class="absolute top-0.5 ${isEnabled ? 'right-0.5' : 'left-0.5'} w-4 h-4 bg-white rounded-full transition-all"></div>
            </div>
        `;
        pList.appendChild(item);
    });

    // 2. Custom Engines List
    const cList = document.getElementById('custom-engines-list');
    cList.innerHTML = '';
    window.cromvaSettings.customEngines.forEach(eng => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between py-2 bg-zinc-900/30 px-3 rounded-lg border border-zinc-800/50 group';
        item.innerHTML = `
            <div>
                <p class="text-sm font-bold text-zinc-200">${eng.name}</p>
                <p class="text-[10px] text-zinc-500 truncate max-w-[200px]">${eng.url}</p>
            </div>
            <button onclick="removeCustomEngine('${eng.id}')" class="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-all">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
        `;
        cList.appendChild(item);
    });
    lucide.createIcons();
}

function toggleProvider(key) {
    window.cromvaSettings.providers[key] = !window.cromvaSettings.providers[key];
    saveSettings();
    renderSearchSettings();
}

function addCustomEngine() {
    const nameInput = document.getElementById('new-engine-name');
    const urlInput = document.getElementById('new-engine-url');
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();

    if (!name || !url) {
        showToast("Preencha nome e URL");
        return;
    }

    if (!url.includes('{text}')) {
        showToast("A URL deve conter {text}");
        return;
    }

    window.cromvaSettings.customEngines.push({
        id: Date.now().toString(),
        name,
        url
    });
    saveSettings();
    renderSearchSettings();

    nameInput.value = '';
    urlInput.value = '';
    showToast("Motor de busca adicionado!");
}

function removeCustomEngine(id) {
    if (confirm('Remover este motor de busca?')) {
        window.cromvaSettings.customEngines = window.cromvaSettings.customEngines.filter(e => e.id !== id);
        saveSettings();
        renderSearchSettings();
        showToast("Motor removido");
    }
}
