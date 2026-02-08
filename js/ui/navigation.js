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
        if (typeof CanvasManager !== 'undefined') {
            setTimeout(() => CanvasManager.resizeCanvas(), 50);
        }
    }

    if (viewId === 'visuals') {
        if (window.Analytics) window.Analytics.update();
    }
}

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

    // Force Canvas Resize
    if (typeof CanvasManager !== 'undefined' && CanvasManager.canvas) {
        setTimeout(() => CanvasManager.resizeCanvas(), 305);
    }
}

function toggleFullscreen() {
    const container = document.getElementById('modal-container');
    isFullscreen = !isFullscreen;
    if (isFullscreen) container.classList.add('modal-fullscreen');
    else container.classList.remove('modal-fullscreen');
}
