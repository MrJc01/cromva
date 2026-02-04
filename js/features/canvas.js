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
    if (!container) return;
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
    const startX = 2000;
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

    // Adicionar Títulos de Colunas
    const cats = Object.keys(categories);
    cats.forEach((cat, idx) => {
        const label = document.createElement('div');
        label.className = 'absolute text-zinc-500 font-bold uppercase tracking-[0.2em] text-lg opacity-50 pointer-events-none';
        label.innerText = cat;
        label.style.top = `${startY}px`;
        label.style.left = `${startX + (idx * colWidth)}px`;
        container.appendChild(label);
    });

    saveCanvasLayout();
    if (window.lucide) lucide.createIcons();
}

// --- CANVAS INTERACTIONS ---
// These will be initialized in main.js or here if we expose them
function setupCanvasListeners() {
    const canvasContainer = document.getElementById('view-canvas');
    const infiniteCanvas = document.getElementById('infinite-canvas');
    if (!canvasContainer || !infiniteCanvas) return;

    let isPanning = false;
    let startPanX, startPanY;

    // Panning do Fundo
    canvasContainer.addEventListener('mousedown', (e) => {
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

    // Zoom com Wheel
    canvasContainer.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            adjustZoom(delta);
        }
    });
}


function startDragNode(e, el, id) {
    e.stopPropagation();
    e.preventDefault();

    let startX = e.clientX;
    let startY = e.clientY;
    let startLeft = parseInt(el.style.left || 0);
    let startTop = parseInt(el.style.top || 0);

    el.classList.add('dragging');

    function moveNode(e) {
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
        canvasState.positions[id] = {
            x: parseInt(el.style.left),
            y: parseInt(el.style.top)
        };
        saveCanvasLayout();
    }

    window.addEventListener('mousemove', moveNode);
    window.addEventListener('mouseup', stopDragNode);
}

function updateCanvasTransform() {
    const infiniteCanvas = document.getElementById('infinite-canvas');
    if (infiniteCanvas) {
        infiniteCanvas.style.transform = `translate(${canvasState.x}px, ${canvasState.y}px) scale(${canvasState.scale})`;
        document.getElementById('zoom-level').innerText = `${Math.round(canvasState.scale * 100)}%`;
    }
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
