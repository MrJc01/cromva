/**
 * Cromva Constants
 * Constantes para strings mágicas
 */

const CROMVA = {
    // Versão
    VERSION: '1.0.0',

    // Storage keys
    STORAGE: {
        STATE: 'cromva_state',
        SETTINGS: 'cromva_settings',
        HANDLES: 'cromva_handles',
        BACKUPS: 'cromva_backups',
        RECENT_LOCATIONS: 'cromva_recent_locations',
        THEME: 'cromva_theme'
    },

    // Event names
    EVENTS: {
        // State
        STATE_LOADED: 'state:loaded',
        STATE_SAVED: 'state:saved',
        STATE_CLEARED: 'state:cleared',

        // Notes
        NOTE_CREATED: 'note:created',
        NOTE_UPDATED: 'note:updated',
        NOTE_DELETED: 'note:deleted',
        NOTE_SELECTED: 'note:selected',

        // Editor
        EDITOR_OPENED: 'editor:opened',
        EDITOR_CLOSED: 'editor:closed',
        EDITOR_SAVED: 'editor:saved',
        EDITOR_CHANGED: 'editor:changed',

        // Workspace
        WORKSPACE_CREATED: 'workspace:created',
        WORKSPACE_SELECTED: 'workspace:selected',
        WORKSPACE_DELETED: 'workspace:deleted',

        // Files
        FILE_OPENED: 'file:opened',
        FILE_SAVED: 'file:saved',
        FILE_DELETED: 'file:deleted',
        FILE_EXTERNAL_CHANGE: 'file:external-change',

        // UI
        THEME_CHANGED: 'theme:changed',
        MODAL_OPENED: 'modal:opened',
        MODAL_CLOSED: 'modal:closed',
        TOAST_SHOWN: 'toast:shown',

        // Navigation
        VIEW_CHANGED: 'view:changed',
        FOLDER_NAVIGATED: 'folder:navigated',

        // Errors
        ERROR_CAPTURED: 'error:captured'
    },

    // View names
    VIEWS: {
        NOTES: 'notes',
        GRAPH: 'graph',
        CANVAS: 'canvas',
        SETTINGS: 'settings'
    },

    // File types
    FILE_TYPES: {
        MARKDOWN: ['.md', '.markdown'],
        TEXT: ['.txt', '.text'],
        ALL_SUPPORTED: ['.md', '.markdown', '.txt', '.text']
    },

    // Limits
    LIMITS: {
        MAX_NOTE_TITLE: 100,
        MAX_NOTE_CONTENT: 1000000, // 1MB
        MAX_FILENAME: 255,
        MAX_RECENT_LOCATIONS: 10,
        MAX_BACKUPS: 5,
        MAX_UNDO_HISTORY: 50
    },

    // Timeouts (ms)
    TIMEOUTS: {
        AUTOSAVE_DEBOUNCE: 1000,
        SEARCH_DEBOUNCE: 300,
        TOAST_DURATION: 3000,
        ANIMATION_DURATION: 200
    },

    // Keyboard shortcuts
    SHORTCUTS: {
        SAVE: 'Ctrl+S',
        NEW_NOTE: 'Ctrl+N',
        SEARCH: 'Ctrl+K',
        UNDO: 'Ctrl+Z',
        REDO: 'Ctrl+Y',
        BOLD: 'Ctrl+B',
        ITALIC: 'Ctrl+I',
        FOCUS_MODE: 'Ctrl+Shift+F',
        DEBUG_PANEL: 'Ctrl+Shift+D',
        CLOSE_MODAL: 'Escape'
    },

    // Themes
    THEMES: {
        DARK: 'dark',
        LIGHT: 'light',
        HIGH_CONTRAST: 'high-contrast'
    },

    // CSS Classes
    CSS: {
        HIDDEN: 'hidden',
        ACTIVE: 'active',
        SELECTED: 'selected',
        LOADING: 'loading',
        DISABLED: 'disabled',
        ANIMATE_IN: 'animate-fade-in',
        ANIMATE_OUT: 'animate-fade-out'
    },

    // Error codes
    ERRORS: {
        PERMISSION_DENIED: 'PERMISSION_DENIED',
        FILE_NOT_FOUND: 'FILE_NOT_FOUND',
        INVALID_DATA: 'INVALID_DATA',
        STORAGE_FULL: 'STORAGE_FULL',
        NETWORK_ERROR: 'NETWORK_ERROR'
    },

    // Module interface
    MODULE_INTERFACE: ['init', 'destroy', 'getState']
};

// Freeze para evitar modificações
Object.freeze(CROMVA);
Object.freeze(CROMVA.STORAGE);
Object.freeze(CROMVA.EVENTS);
Object.freeze(CROMVA.VIEWS);
Object.freeze(CROMVA.FILE_TYPES);
Object.freeze(CROMVA.LIMITS);
Object.freeze(CROMVA.TIMEOUTS);
Object.freeze(CROMVA.SHORTCUTS);
Object.freeze(CROMVA.THEMES);
Object.freeze(CROMVA.CSS);
Object.freeze(CROMVA.ERRORS);

// Export global
window.CROMVA = CROMVA;
