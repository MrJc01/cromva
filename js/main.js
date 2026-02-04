/**
 * CROMVA OS - MAIN ENTRY POINT
 * This file handles initialization and global event listeners.
 * Config and Logic are distributed in:
 * - js/core/
 * - js/ui/
 * - js/features/
 */

// --- GLOBAL LISTENERS ---
document.getElementById('modal-textarea').addEventListener('input', updatePreviewRender);
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!document.getElementById('preview-modal').classList.contains('hidden')) saveCurrentNote();
    }
});

// --- INITIALIZATION ---
window.onload = () => {
    // Initialize Editor
    renderNotes();

    // Initialize Canvas Logic (listeners)
    if (typeof setupCanvasListeners === 'function') setupCanvasListeners();

    // Icons
    if (window.lucide) lucide.createIcons();

    // Spotlight Init
    if (SpotlightManager && SpotlightManager.init) SpotlightManager.init();
};
