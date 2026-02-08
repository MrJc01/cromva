/**
 * Cromva Module Interface
 * Interface padrão para módulos
 */

const ModuleRegistry = {
    // Módulos registrados
    modules: new Map(),

    /**
     * Registra módulo
     */
    register(name, module) {
        // Validar interface
        const hasInit = typeof module.init === 'function';
        const hasDestroy = typeof module.destroy === 'function';
        const hasGetState = typeof module.getState === 'function';

        this.modules.set(name, {
            module,
            hasInit,
            hasDestroy,
            hasGetState,
            initialized: false
        });

        CromvaLogger?.info('ModuleRegistry', `Registered: ${name}`);
    },

    /**
     * Retorna módulo
     */
    get(name) {
        return this.modules.get(name)?.module;
    },

    /**
     * Inicializa todos os módulos
     */
    async initAll() {
        for (const [name, data] of this.modules) {
            if (data.hasInit && !data.initialized) {
                try {
                    await data.module.init();
                    data.initialized = true;
                    CromvaLogger?.debug('ModuleRegistry', `Initialized: ${name}`);
                } catch (e) {
                    CromvaLogger?.error('ModuleRegistry', `Init failed: ${name}`, e);
                }
            }
        }
    },

    /**
     * Destrói todos os módulos
     */
    async destroyAll() {
        for (const [name, data] of this.modules) {
            if (data.hasDestroy && data.initialized) {
                try {
                    await data.module.destroy();
                    data.initialized = false;
                    CromvaLogger?.debug('ModuleRegistry', `Destroyed: ${name}`);
                } catch (e) {
                    CromvaLogger?.error('ModuleRegistry', `Destroy failed: ${name}`, e);
                }
            }
        }
    },

    /**
     * Retorna estado de todos os módulos
     */
    getAllState() {
        const states = {};

        for (const [name, data] of this.modules) {
            if (data.hasGetState) {
                try {
                    states[name] = data.module.getState();
                } catch (e) {
                    states[name] = { error: e.message };
                }
            }
        }

        return states;
    },

    /**
     * Lista módulos
     */
    list() {
        return Array.from(this.modules.keys());
    },

    /**
     * Verifica status
     */
    getStatus() {
        const status = [];

        for (const [name, data] of this.modules) {
            status.push({
                name,
                hasInit: data.hasInit,
                hasDestroy: data.hasDestroy,
                hasGetState: data.hasGetState,
                initialized: data.initialized
            });
        }

        return status;
    }
};

/**
 * Factory para criar módulo com interface padrão
 */
function createModule(name, implementation) {
    const module = {
        _name: name,
        _state: {},
        _initialized: false,

        init() {
            if (this._initialized) return;

            if (implementation.init) {
                implementation.init.call(this);
            }

            this._initialized = true;
            CromvaLogger?.debug(name, 'Initialized');
        },

        destroy() {
            if (!this._initialized) return;

            if (implementation.destroy) {
                implementation.destroy.call(this);
            }

            this._initialized = false;
            this._state = {};
            CromvaLogger?.debug(name, 'Destroyed');
        },

        getState() {
            if (implementation.getState) {
                return implementation.getState.call(this);
            }
            return { ...this._state };
        },

        // Mesclar outras funções
        ...implementation
    };

    // Registrar automaticamente
    ModuleRegistry.register(name, module);

    return module;
}

// Export global
window.ModuleRegistry = ModuleRegistry;
window.createModule = createModule;
