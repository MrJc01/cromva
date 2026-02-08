/**
 * Analytics Engine for Cromva - "Pro-Grade" Canvas Edition
 * High-Performance Visualization
 */

const Analytics = {
    stopWords: new Set([
        // Portuguese
        'de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'ao', 'ele', 'das', 'à', 'seu', 'sua', 'ou', 'quando', 'muito', 'nos', 'já', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'depois', 'sem', 'mesmo', 'aos', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'você', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'numa', 'pelos', 'elas', 'qual', 'nós', 'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'dele', 'tu', 'te', 'vocês', 'vos', 'lhes', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'nosso', 'nossa', 'nossos', 'nossas', 'dela', 'delas', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'aquilo', 'estou', 'está', 'estamos', 'estão', 'estive', 'esteve', 'estivemos', 'estiveram', 'estava', 'estávamos', 'estavam', 'estivera', 'estivéramos', 'esteja', 'estejamos', 'estejam', 'estivesse', 'estivéssemos', 'estivessem', 'estiver', 'estivermos', 'estiverem', 'hei', 'há', 'havemos', 'hão', 'houve', 'houvemos', 'houveram', 'houvera', 'houvéramos', 'haja', 'hajamos', 'hajam', 'houvesse', 'houvéssemos', 'houvessem', 'houver', 'houvermos', 'houverem', 'houverei', 'houverá', 'houveremos', 'houverão', 'houveria', 'houveríamos', 'houveriam', 'sou', 'somos', 'são', 'era', 'éramos', 'eram', 'fui', 'foi', 'fomos', 'foram', 'fora', 'fôramos', 'seja', 'sejamos', 'sejam', 'fosse', 'fôssemos', 'fossem', 'for', 'formos', 'forem', 'serei', 'será', 'seremos', 'serão', 'seria', 'seríamos', 'seriam', 'tenho', 'tem', 'temos', 'tém', 'tinha', 'tínhamos', 'tinham', 'tive', 'teve', 'tivemos', 'tiveram', 'tivera', 'tivéramos', 'tenha', 'tenhamos', 'tenham', 'tivesse', 'tivéssemos', 'tivessem', 'tiver', 'tivermos', 'tiverem', 'terei', 'terá', 'teremos', 'terão', 'teria', 'teríamos', 'teriam',
        // English
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me'
    ]),

    // Engine State
    canvas: null,
    ctx: null,
    nodes: [],
    animationId: null,
    debouncer: null,

    // Camera
    camera: { x: 0, y: 0, z: 1 },
    isDragging: false,
    lastMouse: { x: 0, y: 0 },
    mouse: { x: 0, y: 0 }, // Viewport coordinates

    // Interaction
    hoveredNode: null,

    init() {
        const container = document.querySelector('#view-visuals .grid');
        if (!container) return;

        // Clean & Setup DOM
        container.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'w-full h-full relative rounded-xl overflow-hidden glass border border-zinc-800 group';
        wrapper.style.minHeight = '600px';

        // Label
        const label = document.createElement('h3');
        label.className = 'text-zinc-500 text-[10px] font-bold uppercase tracking-widest absolute top-4 left-4 z-10 pointer-events-none select-none';
        label.innerText = 'Neural Cloud Engine';
        wrapper.appendChild(label);

        // Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing';
        wrapper.appendChild(this.canvas);
        container.appendChild(wrapper);

        this.ctx = this.canvas.getContext('2d', { alpha: true });

        // Event Listeners
        window.addEventListener('resize', () => this._resize());
        this._setupInput();

        // Initial setup
        this._resize();
        this.update();
    },

    update() {
        if (this.debouncer) clearTimeout(this.debouncer);
        this.debouncer = setTimeout(() => this._processData(), 500);
    },

    _processData() {
        if (!document.getElementById('view-visuals').classList.contains('active')) {
            if (this.animationId) cancelAnimationFrame(this.animationId);
            return;
        }


        // Lazy Init
        if (!this.ctx) this.init();
        if (!this.ctx) return;

        const allText = window.notes.map(n => n.title + ' ' + n.content).join(' ');
        const wordCounts = this._countWords(allText);

        const rawWords = Object.entries(wordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50);

        if (rawWords.length === 0) return;

        // Calculate Weights
        const maxWeight = rawWords[0][1];
        const minWeight = rawWords[rawWords.length - 1][1];

        // Create Physics Nodes
        // We preserve existing nodes if they match to allow smooth transitions in future versions
        // For now, simpler to rebuild mostly but ideally we'd diff.

        this.nodes = rawWords.map(([text, count], index) => {
            // Font Size Mapping
            const size = 16 + ((count - minWeight) / (maxWeight - minWeight || 1)) * 64;

            // Measure Text (Requires context to be set up)
            this.ctx.font = `bold ${size}px Inter, sans-serif`;
            const metrics = this.ctx.measureText(text);
            const width = metrics.width;
            const height = size; // Approx

            // Spiral Placement
            const angle = 0.6 * index;
            const radius = 8 * index;
            const x = this.canvas.width / 2 + radius * Math.cos(angle);
            const y = this.canvas.height / 2 + radius * Math.sin(angle);

            return {
                text,
                count,
                x, y,
                vx: 0, vy: 0,
                width, height,
                size,
                color: index < 5 ? '#f4f4f5' : (index < 15 ? '#a1a1aa' : '#52525b'),
                alpha: 0
            };
        });

        // Center Camera
        this.camera.x = this.canvas.width / 2;
        this.camera.y = this.canvas.height / 2;

        if (!this.animationId) this._loop();
    },

    _countWords(text) {
        const counts = {};
        const tokens = text.toLowerCase().match(/\b[\w\u00C0-\u00FF]+\b/g) || [];
        for (const token of tokens) {
            if (token.length < 3) continue;
            if (this.stopWords.has(token)) continue;
            if (/^\d+$/.test(token)) continue;
            counts[token] = (counts[token] || 0) + 1;
        }
        return counts;
    },

    _resize() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = parent.clientWidth * dpr;
        this.canvas.height = parent.clientHeight * dpr;
        this.ctx.scale(dpr, dpr);

        this.canvas.style.width = `${parent.clientWidth}px`;
        this.canvas.style.height = `${parent.clientHeight}px`;
    },

    _setupInput() {
        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouse = getPos(e);
            this.canvas.style.cursor = 'grabbing';
            this.mouse = this.lastMouse;
        });

        window.addEventListener('mousemove', (e) => {
            const pos = getPos(e);
            this.mouse = pos;

            if (this.isDragging) {
                const dx = pos.x - this.lastMouse.x;
                const dy = pos.y - this.lastMouse.y;

                this.camera.x -= dx / this.camera.z;
                this.camera.y -= dy / this.camera.z;

                this.lastMouse = pos;
            } else {
                // Raycast for hover
                this._checkHover();
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.hoveredNode) {
                this.showContextPopup(this.hoveredNode.text);
            }
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const pos = getPos(e);

            // Zoom towards mouse
            const worldX = (pos.x / this.canvas.width * 2 - 1) * this.canvas.width / 2; // Approximate relative factor

            const zoomSensitivity = 0.001;
            const newZoom = this.camera.z - e.deltaY * zoomSensitivity * this.camera.z;
            this.camera.z = Math.min(Math.max(0.1, newZoom), 5);
        }, { passive: false });
    },

    _checkHover() {
        // Transform mouse to world
        // World -> Screen: (world - cam) * zoom + screenCenter
        // Screen -> World: (screen - screenCenter) / zoom + cam
        const screenCenterX = (this.canvas.width / 2) / (window.devicePixelRatio || 1);
        const screenCenterY = (this.canvas.height / 2) / (window.devicePixelRatio || 1);

        const worldMouseX = (this.mouse.x - screenCenterX) / this.camera.z + this.camera.x;
        const worldMouseY = (this.mouse.y - screenCenterY) / this.camera.z + this.camera.y;

        let found = null;
        // Check simple bounding box
        for (const node of this.nodes) {
            // Simple radius approximation or box
            const halfW = node.width / 2;
            const halfH = node.height / 2;

            if (worldMouseX >= node.x - halfW && worldMouseX <= node.x + halfW &&
                worldMouseY >= node.y - halfH && worldMouseY <= node.y + halfH) {
                found = node;
                break; // First one on top? We don't verify z-index but list logic usually sufficient
            }
        }

        this.hoveredNode = found;
        if (found) {
            this.canvas.style.cursor = 'pointer';
        } else if (!this.isDragging) {
            this.canvas.style.cursor = 'grab';
        }
    },

    _loop() {
        if (!document.getElementById('view-visuals').classList.contains('active')) {
            this.animationId = null;
            return;
        }

        this._updatePhysics();
        this._draw();
        this.animationId = requestAnimationFrame(() => this._loop());
    },

    _updatePhysics() {
        const centerX = this.canvas.width / 2; // This is actually largely irrelevant due to camera, but we sort of center simulation at 0,0 relative? 
        // Let's stick to simulation coordinates where 0,0 is origin? 
        // Currently nodes initialized at canvas.width / 2. Let's assume world center is roughly there.

        const centerPull = 0.005;
        const repulsion = 20;

        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];

            // 1. Gravity to "Origin" (initially canvas center)
            const originX = this.canvas.width / 2;
            const originY = this.canvas.height / 2;

            node.vx += (originX - node.x) * centerPull;
            node.vy += (originY - node.y) * centerPull;

            // 2. Repulsion
            for (let j = 0; j < this.nodes.length; j++) {
                if (i === j) continue;
                const other = this.nodes[j];

                const dx = node.x - other.x;
                const dy = node.y - other.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = (node.width + other.width) * 0.45; // Text boxes

                if (dist < minDist) {
                    if (dist === 0) dist = 0.1;
                    const force = (minDist - dist) / minDist;
                    node.vx += (dx / dist) * force * 2;
                    node.vy += (dy / dist) * force * 2;
                }
            }

            // 3. Float
            node.vx += (Math.random() - 0.5) * 0.1;
            node.vy += (Math.random() - 0.5) * 0.1;

            // Integrate
            node.vx *= 0.90; // FRICTION
            node.vy *= 0.90;
            node.x += node.vx;
            node.y += node.vy;

            // Fade in
            if (node.alpha < 1) node.alpha += 0.02;
        }
    },

    _draw() {
        if (!this.ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const width = this.canvas.width / dpr;
        const height = this.canvas.height / dpr;

        // Clear
        this.ctx.clearRect(0, 0, width, height);

        this.ctx.save();

        // Apply Camera
        // Translate to center, scale, translate back
        const cx = width / 2;
        const cy = height / 2;

        this.ctx.translate(cx, cy);
        this.ctx.scale(this.camera.z, this.camera.z);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Draw Nodes
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (const node of this.nodes) {
            this.ctx.save();
            this.ctx.translate(node.x, node.y);

            this.ctx.globalAlpha = node.alpha;
            this.ctx.font = `${node === this.hoveredNode ? 'bold' : 'normal'} ${node.size}px Inter, sans-serif`;

            // Shadow/Glow
            if (node === this.hoveredNode) {
                this.ctx.shadowColor = 'rgba(96, 165, 250, 0.8)'; // Blue-400
                this.ctx.shadowBlur = 20;
                this.ctx.fillStyle = '#60a5fa';
            } else {
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = node.color;
            }

            this.ctx.fillText(node.text, 0, 0);

            this.ctx.restore();
        }

        this.ctx.restore();
    },

    showContextPopup(term) {
        // Reuse logic but ensure UI element logic is same
        // Copied from previous logic slightly optimized
        const results = [];
        const regex = new RegExp(`(${term})`, 'gi');
        // ... (Same search logic as before) ...
        // Re-implementing search briefly for completeness in this One-Shot override

        const escapeHtml = (unsafe) => {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        window.notes.forEach(note => {
            const contentMatches = [...note.content.matchAll(regex)];
            const titleMatch = regex.test(note.title);
            if (titleMatch || contentMatches.length > 0) {
                const snippets = [];
                contentMatches.forEach(match => {
                    const start = Math.max(0, match.index - 30);
                    const end = Math.min(note.content.length, match.index + term.length + 30);
                    let text = escapeHtml(note.content.substring(start, end));
                    text = text.replace(new RegExp(`(${term})`, 'gi'), '<span class="text-blue-400 font-bold bg-blue-400/10 rounded px-0.5">$1</span>');
                    snippets.push(`...${text}...`);
                });
                if (snippets.length === 0 && titleMatch) snippets.push('No título');
                results.push({ note, snippets: snippets.slice(0, 3) });
            }
        });

        const popupId = 'analytics-popup';
        document.getElementById(popupId)?.remove();

        const popup = document.createElement('div');
        popup.id = popupId;
        popup.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate__animated animate__fadeIn animate__faster';
        popup.innerHTML = `
            <div class="glass w-full max-w-lg max-h-[80vh] flex flex-col rounded-xl border border-zinc-700 shadow-2xl relative overflow-hidden animate__animated animate__zoomIn animate__faster">
                <div class="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                    <h3 class="font-bold text-zinc-100 flex items-center gap-2">
                        "${term}" <span class="text-xs font-normal text-zinc-500 ml-2">${results.length} notas</span>
                    </h3>
                    <button id="close-analytics-popup" class="text-zinc-500 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 bg-[#09090b]">
                    ${results.map(r => `
                        <div class="p-3 hover:bg-zinc-800/50 rounded-lg cursor-pointer border border-transparent hover:border-zinc-700 transition-all group"
                             onclick="Analytics.openNoteContext('${r.note.id}')">
                            <span class="font-bold text-sm text-zinc-200 group-hover:text-blue-300">${r.note.title}</span>
                            <div class="space-y-1 pl-2 mt-2">${r.snippets.map(s => `<div class="text-xs text-zinc-500 font-mono border-l-2 border-zinc-800 pl-2">${s}</div>`).join('')}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        if (window.lucide) lucide.createIcons();
        document.getElementById('close-analytics-popup').onclick = () => popup.remove();
        popup.onclick = (e) => { if (e.target === popup) popup.remove(); };
    },

    openNoteContext(noteId) {
        document.getElementById('analytics-popup')?.remove();

        // Fix ID type mismatch (onclick sends string, but ids are numbers)
        let finalId = noteId;
        const note = window.notes.find(n => n.id == noteId);
        if (note) finalId = note.id;

        if (typeof openPreview === 'function') openPreview(finalId, true);
    }
};

window.Analytics = Analytics;
