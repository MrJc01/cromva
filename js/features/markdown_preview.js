/**
 * Cromva Markdown Preview
 * Preview em tempo real otimizado
 */

const MarkdownPreview = {
    previewElement: null,
    debounceTimer: null,
    debounceDelay: 150,  // ms

    /**
     * Inicializa o preview
     */
    init(textareaId = 'modal-textarea', previewId = 'modal-preview') {
        this.textarea = typeof textareaId === 'string'
            ? document.getElementById(textareaId)
            : textareaId;

        this.previewElement = typeof previewId === 'string'
            ? document.getElementById(previewId)
            : previewId;

        if (!this.textarea) return;

        // Listener com debounce
        this.textarea.addEventListener('input', () => this.scheduleUpdate());

        console.log('[MarkdownPreview] Initialized');
    },

    /**
     * Agenda update com debounce
     */
    scheduleUpdate() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.update();
        }, this.debounceDelay);
    },

    /**
     * Atualiza o preview
     */
    update() {
        if (!this.textarea || !this.previewElement) return;

        const markdown = this.textarea.value;
        const html = this.parse(markdown);

        // Atualizar apenas se mudou
        if (this.previewElement.innerHTML !== html) {
            this.previewElement.innerHTML = html;
        }
    },

    /**
     * Parse markdown para HTML (otimizado)
     */
    parse(markdown) {
        if (!markdown) return '<p class="text-zinc-500 italic">Preview vazio</p>';

        let html = this.escapeHtml(markdown);

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-zinc-200 mt-4 mb-2">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-zinc-100 mt-6 mb-3">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mt-6 mb-4">$1</h1>');

        // Bold & Italic
        html = html.replace(/\*\*\*(.+?)\*\*\*/gim, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/gim, '<strong class="font-bold text-white">$1</strong>');
        html = html.replace(/\*(.+?)\*/gim, '<em class="italic">$1</em>');
        html = html.replace(/_(.+?)_/gim, '<em class="italic">$1</em>');

        // Strikethrough
        html = html.replace(/~~(.+?)~~/gim, '<del class="line-through text-zinc-500">$1</del>');

        // Code blocks
        html = html.replace(/```(\w*)\n([\s\S]*?)```/gim,
            '<pre class="bg-zinc-900 border border-zinc-700 rounded-lg p-4 my-4 overflow-x-auto"><code class="text-emerald-400 text-sm font-mono">$2</code></pre>');

        // Inline code
        html = html.replace(/`([^`]+)`/gim,
            '<code class="bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-400 text-sm font-mono">$1</code>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim,
            '<a href="$2" class="text-blue-400 hover:underline" target="_blank">$1</a>');

        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim,
            '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4">');

        // Blockquotes
        html = html.replace(/^> (.*$)/gim,
            '<blockquote class="border-l-4 border-zinc-600 pl-4 my-4 text-zinc-400 italic">$1</blockquote>');

        // Horizontal rules
        html = html.replace(/^---$/gim, '<hr class="border-zinc-700 my-6">');

        // Lists
        html = html.replace(/^\- \[x\] (.*$)/gim,
            '<div class="flex items-center gap-2 my-1"><span class="text-emerald-400">✓</span><span class="line-through text-zinc-500">$1</span></div>');
        html = html.replace(/^\- \[ \] (.*$)/gim,
            '<div class="flex items-center gap-2 my-1"><span class="text-zinc-500">○</span><span>$1</span></div>');
        html = html.replace(/^\- (.*$)/gim,
            '<li class="ml-4 list-disc text-zinc-300">$1</li>');
        html = html.replace(/^\d+\. (.*$)/gim,
            '<li class="ml-4 list-decimal text-zinc-300">$1</li>');

        // Paragraphs
        html = html.replace(/\n\n/gim, '</p><p class="my-3 text-zinc-300">');
        html = html.replace(/\n/gim, '<br>');

        // Wrap in paragraph if not starting with block element
        if (!html.startsWith('<h') && !html.startsWith('<pre') && !html.startsWith('<blockquote')) {
            html = '<p class="my-3 text-zinc-300">' + html + '</p>';
        }

        return html;
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
     * Alternar entre edição e preview
     */
    toggleMode(mode) {
        const editBtn = document.querySelector('[data-mode="edit"]');
        const previewBtn = document.querySelector('[data-mode="preview"]');

        if (mode === 'edit') {
            this.textarea?.classList.remove('hidden');
            this.previewElement?.classList.add('hidden');
            editBtn?.classList.add('bg-zinc-700');
            previewBtn?.classList.remove('bg-zinc-700');
        } else {
            this.update();
            this.textarea?.classList.add('hidden');
            this.previewElement?.classList.remove('hidden');
            editBtn?.classList.remove('bg-zinc-700');
            previewBtn?.classList.add('bg-zinc-700');
        }
    }
};

// Export global
window.MarkdownPreview = MarkdownPreview;
