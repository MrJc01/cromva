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

    // Filter notes by current workspace
    const currentWsId = window.currentWorkspaceId;
    const filteredNotes = notes.filter(n => {
        if (!currentWsId) return true; // Show all if no workspace selected (or root)
        return n.location && n.location.workspaceId === currentWsId;
    });

    graphNodes = filteredNotes.map(n => ({
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
