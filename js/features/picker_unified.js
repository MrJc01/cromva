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
        if (workspaceId && this.workspaceManager) {
            const files = this.workspaceManager.getWorkspaceFiles(workspaceId);
            if (files.length > 0) {
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
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4';

            let html = `
                <div class="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden">
                    <div class="p-4 border-b border-zinc-800">
                        <h2 class="text-lg font-semibold text-white">Selecionar Arquivo</h2>
                    </div>
                    <div class="max-h-80 overflow-y-auto p-2">
            `;

            for (const file of files) {
                html += `
                    <div class="file-item p-3 hover:bg-zinc-800 rounded-lg cursor-pointer flex items-center gap-3"
                         data-name="${file.name}">
                        <span class="text-lg">📄</span>
                        <div class="flex-1 min-w-0">
                            <div class="text-white truncate">${file.name}</div>
                            <div class="text-xs text-zinc-500">${this._formatSize(file.size || 0)}</div>
                        </div>
                    </div>
                `;
            }

            html += `
                    </div>
                    <div class="p-4 border-t border-zinc-800 flex gap-2">
                        <button id="picker-open-native" class="flex-1 py-2 text-sm text-zinc-400 hover:text-white">
                            📂 Abrir outro...
                        </button>
                        <button id="picker-cancel" class="px-4 py-2 bg-zinc-700 text-white rounded-lg">
                            Cancelar
                        </button>
                    </div>
                </div>
            `;

            overlay.innerHTML = html;
            document.body.appendChild(overlay);

            // Event handlers
            overlay.querySelectorAll('.file-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const name = item.dataset.name;
                    const file = files.find(f => f.name === name);
                    overlay.remove();

                    if (file?.handle) {
                        const fileData = await file.handle.getFile();
                        const content = await fileData.text();
                        resolve({
                            handle: file.handle,
                            name: file.name,
                            content,
                            size: fileData.size,
                            lastModified: fileData.lastModified
                        });
                    } else {
                        resolve(file);
                    }
                });
            });

            document.getElementById('picker-open-native').addEventListener('click', async () => {
                overlay.remove();
                resolve(await this._openNative(multiple));
            });

            document.getElementById('picker-cancel').addEventListener('click', () => {
                overlay.remove();
                resolve(null);
            });
        });
    },

    /**
     * Formata tamanho
     */
    _formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
};

// Export global
window.PickerUnified = PickerUnified;
