/**
 * CROMVA DEBUG LOGGER
 * 
 * Sistema de logging para debug de interações.
 * Ative/desative pelo console: CromvaDebug.toggle()
 * 
 * Para ativar automaticamente, adicione no index.html:
 * <script src="js/utils/debug.js"></script>
 */

const CromvaDebug = {
    enabled: true,
    logHistory: [],
    maxHistory: 100,

    // Estilo dos logs
    styles: {
        click: 'background: #3b82f6; color: white; padding: 2px 6px; border-radius: 3px;',
        input: 'background: #10b981; color: white; padding: 2px 6px; border-radius: 3px;',
        function: 'background: #f59e0b; color: black; padding: 2px 6px; border-radius: 3px;',
        state: 'background: #8b5cf6; color: white; padding: 2px 6px; border-radius: 3px;',
        error: 'background: #ef4444; color: white; padding: 2px 6px; border-radius: 3px;',
        info: 'background: #6b7280; color: white; padding: 2px 6px; border-radius: 3px;'
    },

    log(type, message, data = null) {
        if (!this.enabled) return;

        const timestamp = new Date().toLocaleTimeString('pt-BR');
        const style = this.styles[type] || this.styles.info;

        const entry = { timestamp, type, message, data };
        this.logHistory.push(entry);
        if (this.logHistory.length > this.maxHistory) this.logHistory.shift();

        console.groupCollapsed(`%c${type.toUpperCase()}%c ${message}`, style, 'color: inherit;');
        console.log('⏰ Time:', timestamp);
        if (data) {
            console.log('📦 Data:', data);
        }
        console.trace('📍 Stack:');
        console.groupEnd();
    },

    toggle() {
        this.enabled = !this.enabled;
        console.log(`%c🔧 CromvaDebug ${this.enabled ? 'ATIVADO' : 'DESATIVADO'}`,
            `font-size: 14px; font-weight: bold; color: ${this.enabled ? '#10b981' : '#ef4444'};`);
        return this.enabled;
    },

    showHistory() {
        console.table(this.logHistory);
    },

    clear() {
        this.logHistory = [];
        console.clear();
        console.log('%c🧹 Debug history cleared', 'color: #6b7280;');
    },

    // Mostra estado atual do sistema
    showState() {
        console.group('%c📊 ESTADO ATUAL DO SISTEMA', this.styles.state);
        console.log('currentNoteId:', typeof currentNoteId !== 'undefined' ? currentNoteId : 'undefined');
        console.log('currentWorkspaceId:', typeof currentWorkspaceId !== 'undefined' ? currentWorkspaceId : 'undefined');
        console.log('notes:', typeof notes !== 'undefined' ? notes : 'undefined');
        console.log('workspaces:', typeof workspaces !== 'undefined' ? workspaces : 'undefined');
        console.log('workspaceFiles:', typeof workspaceFiles !== 'undefined' ? workspaceFiles : 'undefined');
        console.log('FSHandler.handles:', typeof FSHandler !== 'undefined' ? FSHandler.handles : 'undefined');
        console.groupEnd();
    },

    init() {
        // === INTERCEPTAR CLIQUES ===
        document.addEventListener('click', (e) => {
            const target = e.target;
            const info = {
                tagName: target.tagName,
                id: target.id || null,
                className: typeof target.className === 'string' ? target.className.split(' ').slice(0, 3).join(' ') : null,
                text: target.innerText?.substring(0, 50) || null,
                onclick: target.onclick ? 'has onclick' : null,
                x: e.clientX,
                y: e.clientY
            };
            this.log('click', `Clique em <${target.tagName}>${target.id ? '#' + target.id : ''}`, info);
        }, true);

        // === INTERCEPTAR INPUTS ===
        document.addEventListener('input', (e) => {
            const target = e.target;
            this.log('input', `Input em #${target.id || target.name || 'unknown'}`, {
                value: target.value?.substring(0, 100),
                type: target.type
            });
        }, true);

        // === INTERCEPTAR SUBMITS ===
        document.addEventListener('submit', (e) => {
            this.log('function', `Form submit: ${e.target.id || 'unknown form'}`, {
                action: e.target.action
            });
        }, true);

        // === MONITORAR FUNÇÕES IMPORTANTES ===
        this.wrapFunction('deleteCurrentNote');
        this.wrapFunction('saveCurrentNote');
        this.wrapFunction('openPreview');
        this.wrapFunction('closePreview');
        this.wrapFunction('triggerDeleteFile');
        this.wrapFunction('confirmDeleteAction');
        this.wrapFunction('renderNotes');
        this.wrapFunction('saveData');
        this.wrapFunction('quickSaveNote');
        this.wrapFunction('openWorkspaceManager');
        this.wrapFunction('closeWorkspaceManager');
        this.wrapFunction('addWorkspaceFromFolder');

        // LocationPicker methods
        if (typeof LocationPicker !== 'undefined') {
            this.wrapMethod(LocationPicker, 'open');
            this.wrapMethod(LocationPicker, 'confirm');
            this.wrapMethod(LocationPicker, 'close');
        }

        // FSHandler methods
        if (typeof FSHandler !== 'undefined') {
            this.wrapMethod(FSHandler, 'openDirectory');
            this.wrapMethod(FSHandler, 'saveFile');
            this.wrapMethod(FSHandler, 'createNewFile');
            this.wrapMethod(FSHandler, 'deleteFile');
        }

        console.log('%c🚀 CromvaDebug inicializado! Use CromvaDebug.toggle() para ativar/desativar',
            'font-size: 12px; color: #3b82f6;');
        console.log('%c   CromvaDebug.showState()   - Ver estado atual', 'color: #6b7280;');
        console.log('%c   CromvaDebug.showHistory() - Ver histórico de logs', 'color: #6b7280;');
        console.log('%c   CromvaDebug.clear()       - Limpar console', 'color: #6b7280;');
    },

    wrapFunction(fnName) {
        if (typeof window[fnName] !== 'function') return;

        const original = window[fnName];
        const self = this;

        window[fnName] = function (...args) {
            self.log('function', `${fnName}() chamada`, { args });

            try {
                const result = original.apply(this, args);

                // Se retornar uma Promise, logar quando resolver
                if (result instanceof Promise) {
                    result.then(res => {
                        self.log('function', `${fnName}() resolveu`, { result: res });
                    }).catch(err => {
                        self.log('error', `${fnName}() erro`, { error: err.message });
                    });
                }

                return result;
            } catch (err) {
                self.log('error', `${fnName}() erro`, { error: err.message, stack: err.stack });
                throw err;
            }
        };
    },

    wrapMethod(obj, methodName) {
        if (typeof obj[methodName] !== 'function') return;

        const original = obj[methodName];
        const self = this;
        const objName = obj.constructor?.name || 'Object';

        obj[methodName] = function (...args) {
            self.log('function', `${objName}.${methodName}() chamada`, { args });

            try {
                const result = original.apply(this, args);

                if (result instanceof Promise) {
                    result.then(res => {
                        self.log('function', `${objName}.${methodName}() resolveu`, { result: res });
                    }).catch(err => {
                        self.log('error', `${objName}.${methodName}() erro`, { error: err.message });
                    });
                }

                return result;
            } catch (err) {
                self.log('error', `${objName}.${methodName}() erro`, { error: err.message });
                throw err;
            }
        };
    }
};

// Auto-inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CromvaDebug.init());
} else {
    CromvaDebug.init();
}
