/**
 * Cromva Handle Store
 * Persiste FileSystemHandles no IndexedDB para sobreviver reloads
 * 
 * IMPORTANTE: Handles só podem ser reutilizados se o usuário
 * conceder permissão novamente após reload (requisito do browser)
 */

const HandleStore = {
    DB_NAME: 'cromva-handles',
    STORE_NAME: 'handles',
    db: null,

    /**
     * Inicializa o IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, 1);

            request.onerror = () => {
                console.error('[HandleStore] Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('[HandleStore] IndexedDB initialized');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object store for handles
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                    console.log('[HandleStore] Created object store');
                }
            };
        });
    },

    /**
     * Salva um handle no IndexedDB
     * @param {string} id - ID único (workspaceId ou wsId_folderId)
     * @param {FileSystemHandle} handle - O handle do File System API
     * @param {string} type - 'directory' ou 'file'
     */
    async save(id, handle, type = 'directory') {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);

            const record = {
                id: String(id),
                handle: handle,
                type: type,
                name: handle.name,
                savedAt: new Date().toISOString()
            };

            const request = store.put(record);

            request.onsuccess = () => {
                console.log(`[HandleStore] Saved handle: ${id} (${handle.name})`);
                resolve(true);
            };

            request.onerror = () => {
                console.error('[HandleStore] Error saving handle:', request.error);
                reject(request.error);
            };
        });
    },

    /**
     * Recupera um handle do IndexedDB
     * @param {string} id - ID único
     * @returns {FileSystemHandle|null}
     */
    async get(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.get(String(id));

            request.onsuccess = () => {
                const record = request.result;
                if (record && record.handle) {
                    console.log(`[HandleStore] Retrieved handle: ${id}`);
                    resolve(record.handle);
                } else {
                    resolve(null);
                }
            };

            request.onerror = () => {
                console.error('[HandleStore] Error getting handle:', request.error);
                reject(request.error);
            };
        });
    },

    /**
     * Lista todos os handles salvos
     * @returns {Array<{id, name, type, savedAt}>}
     */
    async list() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const records = request.result.map(r => ({
                    id: r.id,
                    name: r.name,
                    type: r.type,
                    savedAt: r.savedAt
                }));
                resolve(records);
            };

            request.onerror = () => {
                console.error('[HandleStore] Error listing handles:', request.error);
                reject(request.error);
            };
        });
    },

    /**
     * Remove um handle do IndexedDB
     * @param {string} id - ID único
     */
    async remove(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const request = store.delete(String(id));

            request.onsuccess = () => {
                console.log(`[HandleStore] Removed handle: ${id}`);
                resolve(true);
            };

            request.onerror = () => {
                console.error('[HandleStore] Error removing handle:', request.error);
                reject(request.error);
            };
        });
    },

    /**
     * Verifica se um handle ainda tem permissão de acesso
     * @param {FileSystemHandle} handle
     * @returns {boolean}
     */
    async checkPermission(handle) {
        if (!handle) return false;

        try {
            // queryPermission verifica sem pedir novamente
            const opts = { mode: 'readwrite' };
            const permission = await handle.queryPermission(opts);
            return permission === 'granted';
        } catch (e) {
            console.warn('[HandleStore] Permission check failed:', e);
            return false;
        }
    },

    /**
     * Solicita permissão para um handle
     * @param {FileSystemHandle} handle
     * @returns {boolean}
     */
    async requestPermission(handle) {
        if (!handle) return false;

        try {
            const opts = { mode: 'readwrite' };
            const permission = await handle.requestPermission(opts);
            return permission === 'granted';
        } catch (e) {
            console.warn('[HandleStore] Permission request failed:', e);
            return false;
        }
    },

    /**
     * Tenta restaurar todos os handles salvos do IndexedDB
     * Retorna TODOS os handles, independente da permissão.
     */
    async restoreAll() {
        const handles = await this.list();
        const restored = {};

        for (const record of handles) {
            const handle = await this.get(record.id);
            if (handle) {
                // permission check is just for logging/debugging now
                const status = await this.checkPermission(handle);
                console.log(`[HandleStore] Restoring ${record.name} (Status: ${status})`);

                restored[record.id] = handle;
            }
        }

        return restored;
    }
};

// Auto-initialize on load
if (typeof window !== 'undefined') {
    window.HandleStore = HandleStore;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => HandleStore.init());
    } else {
        HandleStore.init();
    }
}
