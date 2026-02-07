/**
 * Cromva File Preview
 * Preview de arquivo on hover
 */

const FilePreview = {
    previewElement: null,
    showDelay: 500,  // ms
    hideDelay: 200,
    timer: null,
    currentId: null,

    /**
     * Inicializa o sistema de preview
     */
    init() {
        this.createPreviewElement();
        this.attachListeners();
        console.log('[FilePreview] Initialized');
    },

    /**
     * Cria elemento de preview
     */
    createPreviewElement() {
        if (document.getElementById('file-preview-popup')) return;

        const preview = document.createElement('div');
        preview.id = 'file-preview-popup';
        preview.className = 'fixed z-[70] hidden bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-4 max-w-md max-h-64 overflow-hidden pointer-events-none';
        preview.innerHTML = `
            <div id="file-preview-content" class="text-sm text-zinc-300 overflow-hidden">
                <p class="text-zinc-500 italic">Carregando...</p>
            </div>
        `;

        document.body.appendChild(preview);
        this.previewElement = preview;
    },

    /**
     * Anexa listeners a elementos com data-preview
     */
    attachListeners() {
        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest('[data-preview]');
            if (target) {
                this.scheduleShow(target, e);
            }
        });

        document.addEventListener('mouseout', (e) => {
            const target = e.target.closest('[data-preview]');
            if (target) {
                this.scheduleHide();
            }
        });
    },

    /**
     * Agenda exibição do preview
     */
    scheduleShow(target, event) {
        this.clearTimer();

        this.timer = setTimeout(() => {
            this.show(target, event);
        }, this.showDelay);
    },

    /**
     * Agenda ocultação do preview
     */
    scheduleHide() {
        this.clearTimer();

        this.timer = setTimeout(() => {
            this.hide();
        }, this.hideDelay);
    },

    /**
     * Limpa timer
     */
    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    },

    /**
     * Mostra preview
     */
    async show(target, event) {
        if (!this.previewElement) return;

        const id = target.dataset.id;
        const type = target.dataset.preview;

        // Evitar re-render se mesmo item
        if (this.currentId === id) return;
        this.currentId = id;

        // Posicionar
        this.position(event);

        // Mostrar com loading
        this.previewElement.classList.remove('hidden');
        const content = document.getElementById('file-preview-content');
        content.innerHTML = '<p class="text-zinc-500 italic animate-pulse">Carregando...</p>';

        // Carregar conteúdo
        const html = await this.loadContent(id, type);
        content.innerHTML = html;
    },

    /**
     * Esconde preview
     */
    hide() {
        if (this.previewElement) {
            this.previewElement.classList.add('hidden');
        }
        this.currentId = null;
    },

    /**
     * Posiciona o preview
     */
    position(event) {
        if (!this.previewElement) return;

        const x = event.clientX + 10;
        const y = event.clientY + 10;

        // Ajustar se sair da tela
        const rect = this.previewElement.getBoundingClientRect();
        let finalX = x;
        let finalY = y;

        if (x + 320 > window.innerWidth) {
            finalX = event.clientX - 330;
        }
        if (y + 260 > window.innerHeight) {
            finalY = event.clientY - 270;
        }

        this.previewElement.style.left = `${finalX}px`;
        this.previewElement.style.top = `${finalY}px`;
    },

    /**
     * Carrega conteúdo para preview
     */
    async loadContent(id, type) {
        try {
            if (type === 'note') {
                const note = window.notes?.find(n => n.id === Number(id));
                if (note) {
                    const preview = (note.content || '').substring(0, 300);
                    return `
                        <div class="font-medium text-white mb-2">${this.escapeHtml(note.title)}</div>
                        <div class="text-xs text-zinc-400 mb-2">${note.category || 'Sem categoria'}</div>
                        <div class="text-zinc-400 text-xs leading-relaxed">${this.escapeHtml(preview)}${preview.length >= 300 ? '...' : ''}</div>
                    `;
                }
            } else if (type === 'file') {
                // Arquivos locais - mostrar informações básicas
                const workspace = window.workspaces?.find(w => w.id === window.currentWorkspaceId);
                const files = window.workspaceFiles?.[window.currentWorkspaceId] || [];
                const file = files.find(f => f.id === Number(id));

                if (file) {
                    return `
                        <div class="font-medium text-white mb-2">📄 ${this.escapeHtml(file.name)}</div>
                        <div class="text-xs text-zinc-400">
                            <div>Tipo: ${file.type || 'arquivo'}</div>
                            <div>Tamanho: ${file.size || 'N/A'}</div>
                            <div>Status: ${file.status || 'visible'}</div>
                        </div>
                    `;
                }
            }

            return '<p class="text-zinc-500 italic">Conteúdo não disponível</p>';
        } catch (e) {
            console.error('[FilePreview] Error loading:', e);
            return '<p class="text-red-400">Erro ao carregar preview</p>';
        }
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FilePreview.init());
} else {
    FilePreview.init();
}

// Export global
window.FilePreview = FilePreview;
