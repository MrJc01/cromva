/**
 * Cromva Event Bus
 * Sistema de eventos centralizado para comunicação entre módulos
 */

const CromvaEvents = {
    // Armazenamento de listeners
    _listeners: {},

    // Histórico de eventos (para debug)
    _history: [],
    _maxHistory: 100,

    /**
     * Registra um listener para um evento
     * @param {string} event - Nome do evento
     * @param {Function} callback - Função a ser chamada
     * @param {Object} options - { once: boolean, priority: number }
     * @returns {Function} Função para remover o listener
     */
    on(event, callback, options = {}) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }

        const listener = {
            callback,
            once: options.once || false,
            priority: options.priority || 0
        };

        this._listeners[event].push(listener);

        // Ordenar por prioridade (maior primeiro)
        this._listeners[event].sort((a, b) => b.priority - a.priority);

        // Retorna função de unsubscribe
        return () => this.off(event, callback);
    },

    /**
     * Registra um listener que executa apenas uma vez
     */
    once(event, callback) {
        return this.on(event, callback, { once: true });
    },

    /**
     * Remove um listener
     */
    off(event, callback) {
        if (!this._listeners[event]) return;

        this._listeners[event] = this._listeners[event].filter(
            listener => listener.callback !== callback
        );
    },

    /**
     * Emite um evento
     * @param {string} event - Nome do evento
     * @param {*} data - Dados a serem passados
     */
    emit(event, data = null) {
        // Adicionar ao histórico
        this._history.push({
            event,
            data,
            timestamp: Date.now()
        });

        // Limitar tamanho do histórico
        if (this._history.length > this._maxHistory) {
            this._history.shift();
        }

        // Log de debug
        if (window.CromvaConfig?.DEBUG?.ENABLED) {
            console.log(`[Events] ${event}`, data);
        }

        if (!this._listeners[event]) return;

        // Executar listeners
        const toRemove = [];

        for (const listener of this._listeners[event]) {
            try {
                listener.callback(data);
            } catch (e) {
                console.error(`[Events] Error in listener for ${event}:`, e);
            }

            if (listener.once) {
                toRemove.push(listener);
            }
        }

        // Remover listeners "once"
        for (const listener of toRemove) {
            this.off(event, listener.callback);
        }
    },

    /**
     * Remove todos os listeners de um evento
     */
    clear(event) {
        if (event) {
            delete this._listeners[event];
        } else {
            this._listeners = {};
        }
    },

    /**
     * Lista todos os eventos registrados
     */
    list() {
        return Object.keys(this._listeners).map(event => ({
            event,
            count: this._listeners[event].length
        }));
    },

    /**
     * Retorna o histórico de eventos
     */
    getHistory() {
        return [...this._history];
    },

    // --- EVENTOS PRÉ-DEFINIDOS ---

    // State
    STATE_LOADED: 'state:loaded',
    STATE_SAVED: 'state:saved',
    STATE_CHANGED: 'state:changed',

    // Notes
    NOTE_CREATED: 'note:created',
    NOTE_UPDATED: 'note:updated',
    NOTE_DELETED: 'note:deleted',
    NOTE_OPENED: 'note:opened',
    NOTE_CLOSED: 'note:closed',

    // Workspaces
    WORKSPACE_CREATED: 'workspace:created',
    WORKSPACE_DELETED: 'workspace:deleted',
    WORKSPACE_SWITCHED: 'workspace:switched',
    WORKSPACE_CONNECTED: 'workspace:connected',

    // Files
    FILE_CREATED: 'file:created',
    FILE_SAVED: 'file:saved',
    FILE_DELETED: 'file:deleted',
    FILE_LOADED: 'file:loaded',

    // UI
    MODAL_OPENED: 'ui:modal:opened',
    MODAL_CLOSED: 'ui:modal:closed',
    VIEW_CHANGED: 'ui:view:changed',
    SIDEBAR_TOGGLED: 'ui:sidebar:toggled',
    TOAST_SHOWN: 'ui:toast:shown',

    // Editor
    EDITOR_MODE_CHANGED: 'editor:mode:changed',
    EDITOR_CONTENT_CHANGED: 'editor:content:changed',
    EDITOR_SAVED: 'editor:saved',

    // Navigation
    NAV_SHORTCUT_PRESSED: 'nav:shortcut:pressed'
};

// Export global
window.CromvaEvents = CromvaEvents;
