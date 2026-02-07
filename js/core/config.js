/**
 * Cromva Configuration
 * Configurações centralizadas da aplicação
 */

const CromvaConfig = {
    // Versão da aplicação
    VERSION: '1.0.0',

    // Chaves de localStorage
    STORAGE_KEYS: {
        NOTES: 'cromva-notes',
        WORKSPACES: 'cromva-workspaces',
        WORKSPACE_FILES: 'cromva-workspaceFiles',
        SETTINGS: 'cromva-settings',
        CANVAS_STATE: 'cromva-canvasState',
        CURRENT_WORKSPACE: 'cromva-currentWorkspace'
    },

    // IndexedDB
    INDEXEDDB: {
        DB_NAME: 'cromva-handles',
        STORE_NAME: 'handles'
    },

    // Editor
    EDITOR: {
        AUTO_SAVE_DELAY: 2000,  // ms
        MAX_TITLE_LENGTH: 100,
        MAX_CONTENT_SIZE: 10 * 1024 * 1024,  // 10MB
        PREVIEW_DEBOUNCE: 300  // ms
    },

    // UI
    UI: {
        TOAST_DURATION: 3000,  // ms
        ANIMATION_DURATION: 200,  // ms
        SIDEBAR_WIDTH: 280,
        MODAL_Z_INDEX: 50
    },

    // File System
    FS: {
        SUPPORTED_EXTENSIONS: ['.md', '.txt', '.json'],
        MAX_FILE_SIZE: 50 * 1024 * 1024,  // 50MB
        BACKUP_BEFORE_SAVE: true
    },

    // Canvas
    CANVAS: {
        MIN_ZOOM: 0.1,
        MAX_ZOOM: 5,
        ZOOM_STEP: 0.1,
        GRID_SIZE: 20
    },

    // Graph
    GRAPH: {
        NODE_RADIUS: 8,
        LINK_DISTANCE: 100,
        REPULSION_STRENGTH: 100
    },

    // Keyboard Shortcuts
    SHORTCUTS: {
        SAVE: 'ctrl+s',
        NEW_NOTE: 'ctrl+n',
        SEARCH: 'ctrl+k',
        TOGGLE_SIDEBAR: 'ctrl+b',
        TOGGLE_PREVIEW: 'ctrl+p',
        CLOSE_MODAL: 'escape',
        UNDO: 'ctrl+z',
        REDO: 'ctrl+shift+z'
    },

    // Debug
    DEBUG: {
        ENABLED: false,
        LOG_LEVEL: 'info',  // 'debug' | 'info' | 'warn' | 'error'
        SHOW_TIMESTAMPS: true
    }
};

// Freeze para prevenir modificações acidentais
Object.freeze(CromvaConfig);
Object.freeze(CromvaConfig.STORAGE_KEYS);
Object.freeze(CromvaConfig.INDEXEDDB);
Object.freeze(CromvaConfig.EDITOR);
Object.freeze(CromvaConfig.UI);
Object.freeze(CromvaConfig.FS);
Object.freeze(CromvaConfig.CANVAS);
Object.freeze(CromvaConfig.GRAPH);
Object.freeze(CromvaConfig.SHORTCUTS);
Object.freeze(CromvaConfig.DEBUG);

// Export global
window.CromvaConfig = CromvaConfig;
