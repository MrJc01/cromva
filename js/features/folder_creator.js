/**
 * Cromva Folder Creator
 * Criação de novas pastas inline
 */

const FolderCreator = {
    isCreating: false,
    inputElement: null,

    /**
     * Inicia a criação de pasta
     */
    async start(parentHandle, containerId) {
        if (this.isCreating) return;

        this.isCreating = true;

        const container = typeof containerId === 'string'
            ? document.getElementById(containerId)
            : containerId;

        if (!container) {
            this.isCreating = false;
            return;
        }

        // Criar input inline
        const inputWrapper = document.createElement('div');
        inputWrapper.id = 'folder-creator-input';
        inputWrapper.className = 'flex items-center gap-2 p-2 bg-zinc-800 border border-emerald-500 rounded-lg mb-2';
        inputWrapper.innerHTML = `
            <span class="text-lg">📁</span>
            <input type="text" 
                   id="new-folder-name" 
                   class="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-zinc-500"
                   placeholder="Nome da pasta..."
                   autocomplete="off">
            <button id="folder-create-confirm" class="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-500">✓</button>
            <button id="folder-create-cancel" class="px-2 py-1 text-xs text-zinc-500 hover:text-white">✕</button>
        `;

        // Inserir no início
        container.insertBefore(inputWrapper, container.firstChild);

        // Referências
        const input = document.getElementById('new-folder-name');
        const confirmBtn = document.getElementById('folder-create-confirm');
        const cancelBtn = document.getElementById('folder-create-cancel');

        this.inputElement = input;

        // Focus
        input.focus();

        // Handlers
        const create = async () => {
            const name = input.value.trim();
            if (name) {
                await this.createFolder(parentHandle, name);
            }
            this.cancel();
        };

        const cancel = () => this.cancel();

        confirmBtn.addEventListener('click', create);
        cancelBtn.addEventListener('click', cancel);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                create();
            } else if (e.key === 'Escape') {
                cancel();
            }
        });
    },

    /**
     * Cria a pasta
     */
    async createFolder(parentHandle, name) {
        if (!parentHandle || !name) return false;

        // Validar nome
        if (!this.validateName(name)) {
            showToast('Nome de pasta inválido');
            return false;
        }

        try {
            // Criar a pasta
            await parentHandle.getDirectoryHandle(name, { create: true });

            showToast(`Pasta "${name}" criada!`);

            // Emitir evento
            if (typeof CromvaEvents !== 'undefined') {
                CromvaEvents.emit('folder:created', { name, parentHandle });
            }

            console.log('[FolderCreator] Created folder:', name);
            return true;
        } catch (e) {
            console.error('[FolderCreator] Create error:', e);

            if (e.name === 'TypeMismatchError') {
                showToast('Já existe um arquivo com esse nome');
            } else {
                showToast('Erro ao criar pasta');
            }

            return false;
        }
    },

    /**
     * Valida nome de pasta
     */
    validateName(name) {
        if (!name || name.length === 0) return false;
        if (name.length > 255) return false;

        // Caracteres inválidos
        const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
        if (invalidChars.test(name)) return false;

        // Nomes reservados (Windows)
        const reserved = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
        if (reserved.test(name)) return false;

        // Não pode terminar com . ou espaço
        if (name.endsWith('.') || name.endsWith(' ')) return false;

        return true;
    },

    /**
     * Cancela e remove input
     */
    cancel() {
        const input = document.getElementById('folder-creator-input');
        if (input) {
            input.remove();
        }
        this.isCreating = false;
        this.inputElement = null;
    },

    /**
     * Mostra modal de criação
     */
    async showModal(parentHandle) {
        const name = prompt('Nome da nova pasta:');
        if (!name) return false;

        return await this.createFolder(parentHandle, name);
    }
};

// Export global
window.FolderCreator = FolderCreator;
