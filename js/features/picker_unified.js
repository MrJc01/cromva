/**
 * Cromva Picker Unified
 * Unificação de LocationPicker com WorkspaceManager
 */

const PickerUnified = {
    // Referência ao workspace manager
    get workspaceManager() {
        return window.WorkspaceManager;
    },

    // Referência ao folder navigation
    get folderNav() {
        return window.FolderNavigation;
    },

    /**
     * Abre picker para salvar arquivo
     */
    async saveFile(options = {}) {
        const {
            suggestedName = 'untitled.md',
            content = '',
            workspaceId = window.currentWorkspaceId
        } = options;

        // Se temos um workspace ativo, usar folder do workspace
        if (workspaceId && this.workspaceManager) {
            const workspace = this.workspaceManager.getWorkspace(workspaceId);
            if (workspace?.handle) {
                return this._saveToWorkspace(workspace, suggestedName, content);
            }
        }

        // Fallback: usar showSaveFilePicker nativo
        return this._saveNative(suggestedName, content);
    },

    /**
     * Abre picker para abrir arquivo
     */
    async openFile(options = {}) {
        const {
            multiple = false,
            workspaceId = window.currentWorkspaceId
        } = options;

        // Se temos um workspace ativo, mostrar arquivos do workspace
        if (workspaceId) {
            // Tentar obter via global ou manager
            let files = [];
            if (typeof window.getWorkspaceFiles === 'function') {
                files = window.getWorkspaceFiles(workspaceId);
            } else if (this.workspaceManager && typeof this.workspaceManager.getWorkspaceFiles === 'function') {
                files = this.workspaceManager.getWorkspaceFiles(workspaceId);
            }

            if (files && files.length > 0) {
                return this._showWorkspaceFiles(files, multiple);
            }
        }

        // Fallback: usar showOpenFilePicker nativo
        return this._openNative(multiple);
    },

    /**
     * Salva no workspace
     */
    async _saveToWorkspace(workspace, filename, content) {
        try {
            // Verificar permissão
            const permission = await workspace.handle.queryPermission({ mode: 'readwrite' });
            if (permission !== 'granted') {
                await workspace.handle.requestPermission({ mode: 'readwrite' });
            }

            // Criar ou sobrescrever arquivo
            const fileHandle = await workspace.handle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();

            // Atualizar lista de arquivos do workspace
            if (this.workspaceManager) {
                this.workspaceManager.addFileToWorkspace(workspace.id, {
                    name: filename,
                    handle: fileHandle
                });
            }

            return { success: true, handle: fileHandle, name: filename };
        } catch (e) {
            console.error('[PickerUnified] Save to workspace failed:', e);
            throw e;
        }
    },

    /**
     * Salva com picker nativo
     */
    async _saveNative(suggestedName, content) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName,
                types: [{
                    description: 'Markdown Files',
                    accept: { 'text/markdown': ['.md'] }
                }, {
                    description: 'Text Files',
                    accept: { 'text/plain': ['.txt'] }
                }]
            });

            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();

            return { success: true, handle, name: handle.name };
        } catch (e) {
            if (e.name === 'AbortError') {
                return { success: false, cancelled: true };
            }
            throw e;
        }
    },

    /**
     * Abre com picker nativo
     */
    async _openNative(multiple) {
        try {
            const handles = await window.showOpenFilePicker({
                multiple,
                types: [{
                    description: 'Markdown Files',
                    accept: { 'text/markdown': ['.md', '.markdown'] }
                }, {
                    description: 'Text Files',
                    accept: { 'text/plain': ['.txt'] }
                }]
            });

            const files = [];
            for (const handle of handles) {
                const file = await handle.getFile();
                const content = await file.text();
                files.push({
                    handle,
                    name: file.name,
                    content,
                    size: file.size,
                    lastModified: file.lastModified
                });
            }

            return multiple ? files : files[0];
        } catch (e) {
            if (e.name === 'AbortError') {
                return null;
            }
            throw e;
        }
    },

    /**
     * Mostra UI com arquivos do workspace
     */
    async _showWorkspaceFiles(files, multiple) {
        // Filter out folders to prevent selection of non-file items
        const fileItems = files.filter(f => f.type !== 'folder');

        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4';

            // Base HTML structure
            overlay.innerHTML = `
                <div class="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl">
                    <div class="p-4 border-b border-zinc-800 space-y-3">
                        <h2 class="text-lg font-semibold text-white">Selecionar Arquivo</h2>
                        <div class="relative">
                            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"></i>
                            <input type="text" id="picker-search" 
                                class="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                placeholder="Buscar arquivo..." autofocus>
                        </div>
                    </div>
                    <div id="picker-list" class="max-h-80 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        <!-- Files will be injected here -->
                    </div>
                    <div class="p-4 border-t border-zinc-800 flex gap-2">
                        <button id="picker-open-native" class="flex-1 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                            📂 Abrir outro...
                        </button>
                        <button id="picker-cancel" class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-medium">
                            Cancelar
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            if (window.lucide) lucide.createIcons();

            const listContainer = overlay.querySelector('#picker-list');
            const searchInput = overlay.querySelector('#picker-search');

            // Render function
            const renderList = (items) => {
                if (items.length === 0) {
                    listContainer.innerHTML = `
                        <div class="flex flex-col items-center justify-center py-8 text-zinc-500">
                            <i data-lucide="file-question" class="w-8 h-8 mb-2 opacity-50"></i>
                            <span class="text-xs">Nenhum arquivo encontrado</span>
                        </div>
                    `;
                    if (window.lucide) lucide.createIcons();
                    return;
                }

                let html = '';
                for (const file of items) {
                    html += `
                        <div class="file-item p-3 hover:bg-zinc-800 rounded-lg cursor-pointer flex items-center gap-3 group transition-colors"
                             data-name="${file.name}">
                            <span class="text-lg opacity-70 group-hover:opacity-100 transition-opacity">
                                ${file.name.endsWith('.board') ? '🎨' : '📄'}
                            </span>
                            <div class="flex-1 min-w-0">
                                <div class="text-white truncate text-sm font-medium">${file.name}</div>
                                <div class="text-xs text-zinc-500 flex gap-2">
                                    <span>${this._formatSize(file.size)}</span>
                                    ${file.lastModified ? `<span class="opacity-50">• ${new Date(file.lastModified).toLocaleDateString()}</span>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }
                listContainer.innerHTML = html;

                // Re-attach click listeners
                listContainer.querySelectorAll('.file-item').forEach(item => {
                    item.addEventListener('click', async () => {
                        const name = item.dataset.name;
                        const file = fileItems.find(f => f.name === name);
                        overlay.remove();

                        if (file?.handle) {
                            try {
                                const fileData = await file.handle.getFile();
                                const content = await fileData.text();
                                resolve({
                                    handle: file.handle,
                                    name: file.name,
                                    content,
                                    size: fileData.size,
                                    lastModified: fileData.lastModified
                                });
                            } catch (e) {
                                console.error("Error reading file:", e);
                                resolve(file); // Fallback to just returning the file object
                            }
                        } else {
                            resolve(file);
                        }
                    });
                });
            };

            // Initial render
            renderList(fileItems);

            // Search filter
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = fileItems.filter(f => f.name.toLowerCase().includes(term));
                renderList(filtered);
            });

            // Native picker button
            document.getElementById('picker-open-native').addEventListener('click', async () => {
                overlay.remove();
                resolve(await this._openNative(multiple));
            });

            // Cancel button
            document.getElementById('picker-cancel').addEventListener('click', () => {
                overlay.remove();
                resolve(null);
            });

            // Close on escape
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    overlay.remove();
                    resolve(null);
                }
            });
        });
    },

    /**
     * Formata tamanho
     */
    _formatSize(bytes) {
        if (bytes === undefined || bytes === null || isNaN(bytes)) return '-';
        if (bytes === 0) return '0 B';
        if (typeof bytes === 'string' && (bytes === 'Local' || bytes === 'Virtual')) return bytes;

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
};

// Export global
window.PickerUnified = PickerUnified;
