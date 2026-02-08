/**
 * Cromva State Namespace
 * Namespace centralizado para gestão de estado
 */

const CromvaState = {
    // Versão do schema de dados
    VERSION: '1.0.0',

    // Estado interno
    _state: {
        notes: [],
        workspaces: [],
        workspaceFiles: {},
        currentWorkspaceId: null,
        settings: {},
        favorites: [],
        recentLocations: []
    },

    // Listeners de mudança
    _listeners: new Map(),

    /**
     * Inicializa o estado
     */
    init() {
        this.load();
        console.log('[CromvaState] Initialized with version', this.VERSION);
    },

    /**
     * Carrega estado do localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem('cromva_state');
            if (saved) {
                const data = JSON.parse(saved);

                // Migrar se necessário
                if (data.version !== this.VERSION) {
                    this._migrate(data);
                } else {
                    this._state = { ...this._state, ...data.state };
                }
            }

            // Sincronizar com globais
            this._syncToGlobals();

            console.log('[CromvaState] Loaded', this._state.notes?.length || 0, 'notes');
        } catch (e) {
            console.error('[CromvaState] Load error:', e);
        }
    },

    /**
     * Salva estado no localStorage
     */
    save() {
        try {
            // Sincronizar de globais
            this._syncFromGlobals();

            // Validar antes de salvar
            if (!this._validate()) {
                console.warn('[CromvaState] Validation failed, not saving');
                return false;
            }

            const data = {
                version: this.VERSION,
                timestamp: new Date().toISOString(),
                state: this._state
            };

            localStorage.setItem('cromva_state', JSON.stringify(data));

            // Emitir evento
            this._emit('saved', { timestamp: data.timestamp });

            return true;
        } catch (e) {
            console.error('[CromvaState] Save error:', e);
            return false;
        }
    },

    /**
     * Valida o estado antes de salvar
     */
    _validate() {
        // Verificar estrutura básica
        if (!Array.isArray(this._state.notes)) return false;
        if (!Array.isArray(this._state.workspaces)) return false;
        if (typeof this._state.workspaceFiles !== 'object') return false;

        // Verificar notas
        for (const note of this._state.notes) {
            if (!note.id || !note.title) return false;
        }

        return true;
    },

    /**
     * Migra dados de versão antiga
     */
    _migrate(oldData) {
        console.log('[CromvaState] Migrating from', oldData.version || 'unknown');

        // Backup antes de migrar
        this._createBackup(oldData);

        // Migração básica - copiar dados existentes
        if (oldData.state) {
            this._state = { ...this._state, ...oldData.state };
        }

        // Salvar com nova versão
        this.save();
    },

    /**
     * Cria backup do estado
     */
    _createBackup(data = null) {
        const backup = data || {
            version: this.VERSION,
            timestamp: new Date().toISOString(),
            state: this._state
        };

        const backups = JSON.parse(localStorage.getItem('cromva_backups') || '[]');
        backups.push(backup);

        // Manter apenas últimos 5 backups
        while (backups.length > 5) {
            backups.shift();
        }

        localStorage.setItem('cromva_backups', JSON.stringify(backups));
        console.log('[CromvaState] Backup created');
    },

    /**
     * Restaura backup
     */
    restoreBackup(index = -1) {
        try {
            const backups = JSON.parse(localStorage.getItem('cromva_backups') || '[]');

            if (backups.length === 0) {
                console.warn('[CromvaState] No backups available');
                return false;
            }

            const backup = index === -1 ? backups[backups.length - 1] : backups[index];

            if (!backup) return false;

            this._state = backup.state;
            this._syncToGlobals();
            this.save();

            console.log('[CromvaState] Restored backup from', backup.timestamp);
            return true;
        } catch (e) {
            console.error('[CromvaState] Restore error:', e);
            return false;
        }
    },

    /**
     * Sincroniza estado interno para globais
     * IMPORTANTE: Não sobrescreve dados existentes carregados por state.js
     */
    _syncToGlobals() {
        // Only sync if our internal state has data OR globals are empty
        if (this._state.notes?.length > 0 || !window.notes?.length) {
            window.notes = this._state.notes || [];
        }
        if (this._state.workspaces?.length > 0 || !window.workspaces?.length) {
            window.workspaces = this._state.workspaces || [];
        }
        if (Object.keys(this._state.workspaceFiles || {}).length > 0 || !Object.keys(window.workspaceFiles || {}).length) {
            window.workspaceFiles = this._state.workspaceFiles || {};
        }
        if (this._state.currentWorkspaceId || !window.currentWorkspaceId) {
            window.currentWorkspaceId = this._state.currentWorkspaceId;
        }
    },

    /**
     * Sincroniza globais para estado interno
     */
    _syncFromGlobals() {
        this._state.notes = window.notes || [];
        this._state.workspaces = window.workspaces || [];
        this._state.workspaceFiles = window.workspaceFiles || {};
        this._state.currentWorkspaceId = window.currentWorkspaceId;
    },

    // === GETTERS ===

    /**
     * Retorna todas as notas
     */
    getNotes() {
        return this._state.notes || [];
    },

    /**
     * Retorna nota por ID
     */
    getNote(id) {
        return this._state.notes?.find(n => n.id === id);
    },

    /**
     * Retorna todos os workspaces
     */
    getWorkspaces() {
        return this._state.workspaces || [];
    },

    /**
     * Retorna workspace por ID
     */
    getWorkspace(id) {
        return this._state.workspaces?.find(w => w.id === id);
    },

    /**
     * Retorna configuração
     */
    getSetting(key, defaultValue = null) {
        return this._state.settings?.[key] ?? defaultValue;
    },

    /**
     * Retorna favoritos
     */
    getFavorites() {
        return this._state.favorites || [];
    },

    // === SETTERS ===

    /**
     * Define notas
     */
    setNotes(notes) {
        const oldNotes = this._state.notes;
        this._state.notes = notes;
        window.notes = notes;
        this._emit('notes:changed', { old: oldNotes, new: notes });
    },

    /**
     * Adiciona nota
     */
    addNote(note) {
        this._state.notes.push(note);
        window.notes = this._state.notes;
        this._emit('note:added', { note });
    },

    /**
     * Atualiza nota
     */
    updateNote(id, updates) {
        const note = this.getNote(id);
        if (!note) return false;

        Object.assign(note, updates, { updatedAt: new Date().toISOString() });
        this._emit('note:updated', { note });
        return true;
    },

    /**
     * Remove nota
     */
    removeNote(id) {
        const index = this._state.notes.findIndex(n => n.id === id);
        if (index === -1) return false;

        const note = this._state.notes[index];
        this._state.notes.splice(index, 1);
        window.notes = this._state.notes;
        this._emit('note:removed', { note });
        return true;
    },

    /**
     * Define configuração
     */
    setSetting(key, value) {
        if (!this._state.settings) this._state.settings = {};
        this._state.settings[key] = value;
        this._emit('setting:changed', { key, value });
    },

    // === EVENTOS ===

    /**
     * Adiciona listener
     */
    on(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, []);
        }
        this._listeners.get(event).push(callback);
    },

    /**
     * Remove listener
     */
    off(event, callback) {
        const listeners = this._listeners.get(event);
        if (!listeners) return;

        const index = listeners.indexOf(callback);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    },

    /**
     * Emite evento
     */
    _emit(event, data) {
        const listeners = this._listeners.get(event);
        if (!listeners) return;

        for (const callback of listeners) {
            try {
                callback(data);
            } catch (e) {
                console.error('[CromvaState] Event handler error:', e);
            }
        }

        // Também emitir via CromvaEvents se disponível
        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit(`state:${event}`, data);
        }
    },

    // === EXPORT/IMPORT ===

    /**
     * Exporta estado como JSON
     */
    exportJSON() {
        this._syncFromGlobals();
        return JSON.stringify({
            version: this.VERSION,
            exportedAt: new Date().toISOString(),
            state: this._state
        }, null, 2);
    },

    /**
     * Importa estado de JSON
     */
    importJSON(json) {
        try {
            const data = typeof json === 'string' ? JSON.parse(json) : json;

            this._createBackup();
            this._state = data.state;
            this._syncToGlobals();
            this.save();

            console.log('[CromvaState] Imported', this._state.notes?.length || 0, 'notes');
            return true;
        } catch (e) {
            console.error('[CromvaState] Import error:', e);
            return false;
        }
    },

    /**
     * Limpa todo o estado
     */
    clear() {
        this._createBackup();

        this._state = {
            notes: [],
            workspaces: [],
            workspaceFiles: {},
            currentWorkspaceId: null,
            settings: {},
            favorites: [],
            recentLocations: []
        };

        this._syncToGlobals();
        localStorage.removeItem('cromva_state');

        this._emit('cleared');
        console.log('[CromvaState] Cleared all state');
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CromvaState.init());
} else {
    CromvaState.init();
}

// Export global
window.CromvaState = CromvaState;
