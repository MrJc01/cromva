/**
 * Cromva Editor Renderer
 * Lógica de rendering separada do editor
 */

const EditorRenderer = {
    // Referências
    textarea: null,
    preview: null,

    // Estado
    lastContent: '',

    // Debounce timer
    debounceTimer: null,
    debounceDelay: 150,

    /**
     * Inicializa renderer
     */
    init(textarea, preview) {
        this.textarea = textarea;
        this.preview = preview;

        if (textarea) {
            textarea.addEventListener('input', () => this.scheduleRender());
        }

        console.log('[EditorRenderer] Initialized');
    },

    /**
     * Agenda renderização com debounce
     */
    scheduleRender() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.render();
        }, this.debounceDelay);
    },

    /**
     * Renderiza conteúdo
     */
    render() {
        if (!this.textarea || !this.preview) return;

        const content = this.textarea.value;

        // Skip se não mudou
        if (content === this.lastContent) return;

        this.lastContent = content;

        // Usar MarkdownParser se disponível
        let html;
        if (typeof MarkdownParser !== 'undefined') {
            html = MarkdownParser.parse(content);
        } else {
            html = this.basicParse(content);
        }

        // Atualizar preview
        this.preview.innerHTML = html;

        // Scroll sync
        this.syncScroll();
    },

    /**
     * Parser básico (fallback)
     */
    basicParse(markdown) {
        if (!markdown) {
            return '<p class="text-zinc-500 italic">Preview vazio</p>';
        }

        let html = this.escapeHtml(markdown);

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');

        // Bold & Italic
        html = html.replace(/\*\*(.+?)\*\*/gim, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/gim, '<em>$1</em>');

        // Code
        html = html.replace(/`([^`]+)`/gim, '<code class="bg-zinc-800 px-1 rounded">$1</code>');

        // Paragraphs
        html = html.replace(/\n\n/gim, '</p><p class="my-3">');
        html = html.replace(/\n/gim, '<br>');

        return '<p class="my-3">' + html + '</p>';
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Sincroniza scroll
     */
    syncScroll() {
        if (!this.textarea || !this.preview) return;

        const ratio = this.textarea.scrollTop /
            (this.textarea.scrollHeight - this.textarea.clientHeight);

        this.preview.scrollTop = ratio *
            (this.preview.scrollHeight - this.preview.clientHeight);
    },

    /**
     * Força re-render
     */
    forceRender() {
        this.lastContent = '';
        this.render();
    },

    /**
     * Retorna estado
     */
    getState() {
        return {
            hasTextarea: !!this.textarea,
            hasPreview: !!this.preview,
            contentLength: this.lastContent.length
        };
    },

    /**
     * Limpa
     */
    destroy() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.textarea = null;
        this.preview = null;
        this.lastContent = '';
    }
};

// Export global
window.EditorRenderer = EditorRenderer;
