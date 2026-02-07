/**
 * Cromva Diagnostics Mode
 * Modo de diagnóstico completo
 */

const DiagnosticsMode = {
    // Estado
    isRunning: false,
    results: null,

    /**
     * Executa diagnóstico completo
     */
    async run() {
        this.isRunning = true;
        console.log('[Diagnostics] Starting full diagnostic...');

        this.results = {
            timestamp: new Date().toISOString(),
            browser: this._getBrowserInfo(),
            storage: await this._checkStorage(),
            modules: this._checkModules(),
            memory: this._checkMemory(),
            apis: this._checkAPIs(),
            state: this._checkState(),
            errors: this._getRecentErrors(),
            performance: this._getPerformanceMetrics()
        };

        this.isRunning = false;
        console.log('[Diagnostics] Complete:', this.results);

        return this.results;
    },

    /**
     * Informações do navegador
     */
    _getBrowserInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookiesEnabled: navigator.cookieEnabled,
            online: navigator.onLine,
            colorDepth: screen.colorDepth,
            screenSize: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            devicePixelRatio: window.devicePixelRatio
        };
    },

    /**
     * Verifica storage
     */
    async _checkStorage() {
        const storage = {
            localStorage: { available: false, used: 0, quota: null },
            indexedDB: { available: false },
            storageAPI: { available: false, quota: null, used: null }
        };

        // LocalStorage
        try {
            const testKey = '__diag_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            storage.localStorage.available = true;

            let used = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    used += localStorage[key].length * 2;
                }
            }
            storage.localStorage.used = used;
        } catch (e) {
            storage.localStorage.error = e.message;
        }

        // IndexedDB
        try {
            storage.indexedDB.available = !!window.indexedDB;
        } catch (e) {
            storage.indexedDB.error = e.message;
        }

        // Storage API
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                storage.storageAPI.available = true;
                storage.storageAPI.quota = estimate.quota;
                storage.storageAPI.used = estimate.usage;
                storage.storageAPI.available = estimate.quota - estimate.usage;
            } catch (e) {
                storage.storageAPI.error = e.message;
            }
        }

        return storage;
    },

    /**
     * Verifica módulos carregados
     */
    _checkModules() {
        const modules = [
            'CromvaConfig', 'CromvaEvents', 'CromvaState', 'CromvaLogger',
            'HandleStore', 'FSHandler', 'FileCache', 'FileWatcher',
            'DataManager', 'OfflineMode', 'ErrorHandler', 'ModuleRegistry',
            'Editor', 'WorkspaceManager', 'MarkdownParser', 'EditorRenderer',
            'UndoManager', 'LineCounter', 'EditorToolbar', 'FindReplace',
            'FocusMode', 'FavoritesManager', 'MarkdownPreview', 'MultiSelect',
            'ImageDragDrop', 'RecentLocations', 'PathPreview', 'FolderNavigation',
            'FolderCreator', 'BatchSelection', 'KeyboardManager', 'ModalManager',
            'ContextMenu', 'ThemeManager', 'Animations', 'Breadcrumb',
            'ConnectionStatus', 'FilePreview', 'OnboardingTour', 'WorkspaceUI',
            'StorageInfo', 'DebugPanel', 'PerformanceMetrics'
        ];

        const status = {};
        for (const mod of modules) {
            status[mod] = typeof window[mod] !== 'undefined';
        }

        return {
            total: modules.length,
            loaded: Object.values(status).filter(v => v).length,
            missing: Object.entries(status).filter(([k, v]) => !v).map(([k]) => k),
            details: status
        };
    },

    /**
     * Verifica memória
     */
    _checkMemory() {
        if ('memory' in performance) {
            const mem = performance.memory;
            return {
                usedHeap: this._formatBytes(mem.usedJSHeapSize),
                totalHeap: this._formatBytes(mem.totalJSHeapSize),
                heapLimit: this._formatBytes(mem.jsHeapSizeLimit),
                usedPercent: ((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100).toFixed(1) + '%'
            };
        }
        return { available: false };
    },

    /**
     * Verifica APIs disponíveis
     */
    _checkAPIs() {
        return {
            fileSystem: 'showDirectoryPicker' in window,
            serviceWorker: 'serviceWorker' in navigator,
            indexedDB: 'indexedDB' in window,
            webWorkers: 'Worker' in window,
            notifications: 'Notification' in window,
            clipboard: 'clipboard' in navigator,
            storage: 'storage' in navigator,
            compression: 'CompressionStream' in window,
            intersectionObserver: 'IntersectionObserver' in window,
            resizeObserver: 'ResizeObserver' in window
        };
    },

    /**
     * Verifica estado da aplicação
     */
    _checkState() {
        return {
            notesCount: (window.notes || []).length,
            workspacesCount: (window.workspaces || []).length,
            currentWorkspace: window.currentWorkspaceId,
            currentView: window.currentView,
            theme: document.documentElement.getAttribute('data-theme'),
            focusModeActive: document.body.classList.contains('focus-mode')
        };
    },

    /**
     * Retorna erros recentes
     */
    _getRecentErrors() {
        if (typeof ErrorHandler !== 'undefined') {
            return ErrorHandler.getErrors(5);
        }
        return [];
    },

    /**
     * Retorna métricas de performance
     */
    _getPerformanceMetrics() {
        if (typeof PerformanceMetrics !== 'undefined') {
            return {
                measurements: PerformanceMetrics.getHistory(10),
                navigation: PerformanceMetrics.getNavigationMetrics()
            };
        }
        return {};
    },

    /**
     * Formata bytes
     */
    _formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Mostra UI de diagnóstico
     */
    showUI() {
        this.run().then(results => {
            const overlay = document.createElement('div');
            overlay.id = 'diagnostics-overlay';
            overlay.className = 'fixed inset-0 z-[9999] bg-black/80 overflow-auto p-4';

            overlay.innerHTML = `
                <div class="max-w-4xl mx-auto bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h1 class="text-2xl font-bold text-white">🔍 Diagnóstico do Sistema</h1>
                        <button onclick="DiagnosticsMode.closeUI()" class="text-zinc-400 hover:text-white text-2xl">&times;</button>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        ${this._renderSection('🌐 Navegador', results.browser)}
                        ${this._renderSection('💾 Storage', results.storage)}
                        ${this._renderSection('🧠 Memória', results.memory)}
                        ${this._renderSection('🔌 APIs', results.apis)}
                        ${this._renderSection('📊 Estado', results.state)}
                        ${this._renderModulesSection(results.modules)}
                    </div>

                    <div class="mt-6 flex gap-3">
                        <button onclick="DiagnosticsMode.exportReport()" class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500">
                            📥 Exportar Relatório
                        </button>
                        <button onclick="DiagnosticsMode.run().then(() => DiagnosticsMode.refreshUI())" class="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600">
                            🔄 Atualizar
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
        });
    },

    /**
     * Renderiza seção
     */
    _renderSection(title, data) {
        let content = '';
        for (const [key, value] of Object.entries(data)) {
            const displayValue = typeof value === 'boolean'
                ? (value ? '✅' : '❌')
                : String(value);
            content += `<div class="flex justify-between py-1 border-b border-zinc-800">
                <span class="text-zinc-400">${key}</span>
                <span class="text-white">${displayValue}</span>
            </div>`;
        }
        return `<div class="bg-zinc-800/50 rounded-lg p-4">
            <h3 class="font-semibold text-emerald-400 mb-3">${title}</h3>
            ${content}
        </div>`;
    },

    /**
     * Renderiza seção de módulos
     */
    _renderModulesSection(modules) {
        return `<div class="bg-zinc-800/50 rounded-lg p-4 col-span-2">
            <h3 class="font-semibold text-emerald-400 mb-3">📦 Módulos (${modules.loaded}/${modules.total})</h3>
            ${modules.missing.length > 0
                ? `<p class="text-yellow-400 mb-2">⚠️ Faltando: ${modules.missing.join(', ')}</p>`
                : '<p class="text-emerald-400">✅ Todos os módulos carregados</p>'}
        </div>`;
    },

    /**
     * Fecha UI
     */
    closeUI() {
        const overlay = document.getElementById('diagnostics-overlay');
        if (overlay) overlay.remove();
    },

    /**
     * Atualiza UI
     */
    refreshUI() {
        this.closeUI();
        this.showUI();
    },

    /**
     * Exporta relatório
     */
    exportReport() {
        const data = JSON.stringify(this.results, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `cromva-diagnostics-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }
};

// Export global
window.DiagnosticsMode = DiagnosticsMode;
