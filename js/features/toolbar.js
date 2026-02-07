/**
 * Cromva Editor Toolbar
 * Toolbar com atalhos de formatação para o editor Markdown
 */

const EditorToolbar = {
    textarea: null,
    container: null,

    /**
     * Botões disponíveis
     */
    buttons: [
        { icon: 'B', format: 'bold', title: 'Negrito (Ctrl+B)', wrap: '**' },
        { icon: 'I', format: 'italic', title: 'Itálico (Ctrl+I)', wrap: '_' },
        { icon: 'S', format: 'strike', title: 'Tachado', wrap: '~~' },
        { icon: '⌗', format: 'code', title: 'Código (Ctrl+`)', wrap: '`' },
        { divider: true },
        { icon: 'H1', format: 'h1', title: 'Título 1', prefix: '# ' },
        { icon: 'H2', format: 'h2', title: 'Título 2', prefix: '## ' },
        { icon: 'H3', format: 'h3', title: 'Título 3', prefix: '### ' },
        { divider: true },
        { icon: '•', format: 'ul', title: 'Lista', prefix: '- ' },
        { icon: '1.', format: 'ol', title: 'Lista Ordenada', prefix: '1. ' },
        { icon: '☑', format: 'task', title: 'Tarefa', prefix: '- [ ] ' },
        { divider: true },
        { icon: '🔗', format: 'link', title: 'Link', template: '[texto](url)' },
        { icon: '🖼', format: 'image', title: 'Imagem', template: '![alt](url)' },
        { icon: '📝', format: 'quote', title: 'Citação', prefix: '> ' },
        { icon: '─', format: 'hr', title: 'Linha', insert: '\n---\n' }
    ],

    /**
     * Inicializa a toolbar
     */
    init(textareaId = 'modal-textarea', containerId = 'editor-toolbar') {
        this.textarea = typeof textareaId === 'string'
            ? document.getElementById(textareaId)
            : textareaId;

        this.container = typeof containerId === 'string'
            ? document.getElementById(containerId)
            : containerId;

        if (!this.container) {
            this.createContainer();
        }

        this.render();
        this.registerShortcuts();

        console.log('[EditorToolbar] Initialized');
    },

    /**
     * Cria container se não existir
     */
    createContainer() {
        if (!this.textarea) return;

        const parent = this.textarea.parentElement;
        if (!parent) return;

        this.container = document.createElement('div');
        this.container.id = 'editor-toolbar';
        this.container.className = 'editor-toolbar flex items-center gap-1 p-2 bg-zinc-800 border-b border-zinc-700 rounded-t-lg';

        parent.insertBefore(this.container, this.textarea);
    },

    /**
     * Renderiza a toolbar
     */
    render() {
        if (!this.container) return;

        let html = '';

        for (const btn of this.buttons) {
            if (btn.divider) {
                html += '<div class="w-px h-5 bg-zinc-600 mx-1"></div>';
            } else {
                html += `
                    <button type="button"
                            class="toolbar-btn px-2 py-1 text-sm text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                            data-format="${btn.format}"
                            title="${btn.title}">
                        ${btn.icon}
                    </button>
                `;
            }
        }

        this.container.innerHTML = html;

        // Event listeners
        this.container.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.dataset.format;
                this.applyFormat(format);
            });
        });
    },

    /**
     * Aplica formatação
     */
    applyFormat(format) {
        if (!this.textarea) return;

        const btn = this.buttons.find(b => b.format === format);
        if (!btn) return;

        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const text = this.textarea.value;
        const selected = text.substring(start, end);

        let newText, newStart, newEnd;

        if (btn.wrap) {
            // Envolver seleção
            const wrapped = btn.wrap + selected + btn.wrap;
            newText = text.substring(0, start) + wrapped + text.substring(end);
            newStart = start + btn.wrap.length;
            newEnd = end + btn.wrap.length;
        } else if (btn.prefix) {
            // Adicionar prefixo no início da linha
            const lineStart = text.lastIndexOf('\n', start - 1) + 1;
            newText = text.substring(0, lineStart) + btn.prefix + text.substring(lineStart);
            newStart = start + btn.prefix.length;
            newEnd = end + btn.prefix.length;
        } else if (btn.template) {
            // Inserir template
            newText = text.substring(0, start) + btn.template + text.substring(end);
            newStart = start + btn.template.indexOf('(') + 1;
            newEnd = newStart + (btn.template.includes('texto') ? 5 : 3);
        } else if (btn.insert) {
            // Inserir texto
            newText = text.substring(0, start) + btn.insert + text.substring(end);
            newStart = start + btn.insert.length;
            newEnd = newStart;
        }

        if (newText !== undefined) {
            this.textarea.value = newText;
            this.textarea.setSelectionRange(newStart, newEnd);
            this.textarea.focus();

            // Disparar evento input
            this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    },

    /**
     * Registra atalhos de teclado
     */
    registerShortcuts() {
        if (typeof KeyboardManager === 'undefined') return;

        KeyboardManager.register('ctrl+b', () => this.applyFormat('bold'), {
            name: 'Negrito',
            global: false
        });
        KeyboardManager.register('ctrl+i', () => this.applyFormat('italic'), {
            name: 'Itálico',
            global: false
        });
        KeyboardManager.register('ctrl+`', () => this.applyFormat('code'), {
            name: 'Código',
            global: false
        });
    }
};

// Export global
window.EditorToolbar = EditorToolbar;
