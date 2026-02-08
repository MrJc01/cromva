// --- TAURI BRIDGE ---
// This module exposes Tauri v2 plugins to the rest of the app.
// It is ONLY loaded when running inside Tauri (Desktop).

import * as fs from '@tauri-apps/plugin-fs';
import * as dialog from '@tauri-apps/plugin-dialog';
import * as shell from '@tauri-apps/plugin-shell';
import * as os from '@tauri-apps/plugin-os';

// Expose globally so non-module scripts can access them
window.Tauri = {
    fs,
    dialog,
    shell,
    os,
    isDesktop: true, // Flag to detect desktop mode
};

console.log('[Tauri Bridge] Native plugins loaded and exposed to window.Tauri');
