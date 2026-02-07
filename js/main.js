/**
 * CROMVA OS - MAIN ENTRY POINT
 * This file handles initialization and global event listeners.
 * Config and Logic are distributed in:
 * - js/core/
 * - js/ui/
 * - js/features/
 */

// --- GLOBAL LISTENERS ---

// Input listener com auto-save
const textarea = document.getElementById('modal-textarea');
if (textarea) {
    textarea.addEventListener('input', () => {
        updatePreviewRender();
        // Trigger auto-save
        if (typeof scheduleAutoSave === 'function') {
            scheduleAutoSave();
        }
    });
}

// Title input também trigger auto-save
const titleInput = document.getElementById('modal-title-input');
if (titleInput) {
    titleInput.addEventListener('input', () => {
        if (typeof scheduleAutoSave === 'function') {
            scheduleAutoSave();
        }
    });
}

// --- INITIALIZATION ---
window.onload = async () => {
    // Restore file system handles from IndexedDB
    if (FSHandler && FSHandler.restoreHandles) {
        await FSHandler.restoreHandles();
    }

    // Initialize Editor
    renderNotes();

    // Initialize Canvas Logic (listeners)
    if (typeof setupCanvasListeners === 'function') setupCanvasListeners();

    // Icons
    if (window.lucide) lucide.createIcons();

    // Spotlight Init
    if (SpotlightManager && SpotlightManager.init) SpotlightManager.init();

    console.log('[Cromva] Initialization complete');
};
