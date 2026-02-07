/**
 * Cromva Line Counter
 * Contador de linhas para o editor de texto
 */

const LineCounter = {
    textarea: null,
    container: null,
    lineNumbers: null,

    /**
     * Inicializa o contador de linhas
     */
    init(textareaId = 'modal-textarea', containerId = 'line-counter') {
        this.textarea = typeof textareaId === 'string'
            ? document.getElementById(textareaId)
            : textareaId;

        if (!this.textarea) {
            console.warn('[LineCounter] Textarea not found');
            return;
        }

        // Criar container se não existir
        this.container = document.getElementById(containerId);
        if (!this.container) {
            this.createContainer();
        }

        // Event listeners
        this.textarea.addEventListener('input', () => this.update());
        this.textarea.addEventListener('scroll', () => this.syncScroll());
        this.textarea.addEventListener('keydown', () => requestAnimationFrame(() => this.update()));

        // Renderizar inicial
        this.update();

        console.log('[LineCounter] Initialized');
    },

    /**
     * Cria o container de números de linha
     */
    createContainer() {
        // Buscar o parent do textarea
        const parent = this.textarea.parentElement;
        if (!parent) return;

        // Criar estrutura
        const wrapper = document.createElement('div');
        wrapper.className = 'line-counter-wrapper flex';
        wrapper.style.position = 'relative';

        // Container de números
        this.container = document.createElement('div');
        this.container.id = 'line-counter';
        this.container.className = 'line-numbers bg-zinc-900 text-zinc-500 text-right pr-3 pt-3 select-none border-r border-zinc-700 overflow-hidden';
        this.container.style.fontFamily = 'monospace';
        this.container.style.fontSize = '14px';
        this.container.style.lineHeight = '1.5';
        this.container.style.minWidth = '45px';

        // Mover textarea para wrapper
        parent.insertBefore(wrapper, this.textarea);
        wrapper.appendChild(this.container);
        wrapper.appendChild(this.textarea);

        // Ajustar estilos do textarea
        this.textarea.style.paddingLeft = '12px';
    },

    /**
     * Atualiza os números de linha
     */
    update() {
        if (!this.textarea || !this.container) return;

        const content = this.textarea.value;
        const lines = content.split('\n');
        const lineCount = lines.length;

        // Gerar números
        let html = '';
        for (let i = 1; i <= lineCount; i++) {
            html += `<div class="line-number" style="height: 21px;">${i}</div>`;
        }

        this.container.innerHTML = html;
        this.syncScroll();
    },

    /**
     * Sincroniza scroll com o textarea
     */
    syncScroll() {
        if (!this.textarea || !this.container) return;
        this.container.scrollTop = this.textarea.scrollTop;
    },

    /**
     * Retorna estatísticas do texto
     */
    getStats() {
        if (!this.textarea) return null;

        const content = this.textarea.value;
        const lines = content.split('\n');
        const words = content.trim().split(/\s+/).filter(Boolean);
        const chars = content.length;

        return {
            lines: lines.length,
            words: words.length,
            characters: chars,
            charactersNoSpaces: content.replace(/\s/g, '').length
        };
    },

    /**
     * Mostra estatísticas em um elemento
     */
    showStats(elementId) {
        const element = typeof elementId === 'string'
            ? document.getElementById(elementId)
            : elementId;

        if (!element) return;

        const stats = this.getStats();
        if (!stats) return;

        element.innerHTML = `
            <span class="text-zinc-500 text-xs">
                ${stats.lines} linhas · ${stats.words} palavras · ${stats.characters} caracteres
            </span>
        `;
    },

    /**
     * Vai para uma linha específica
     */
    goToLine(lineNumber) {
        if (!this.textarea) return;

        const lines = this.textarea.value.split('\n');
        if (lineNumber < 1 || lineNumber > lines.length) return;

        // Calcular posição
        let position = 0;
        for (let i = 0; i < lineNumber - 1; i++) {
            position += lines[i].length + 1; // +1 para o \n
        }

        // Focar e mover cursor
        this.textarea.focus();
        this.textarea.setSelectionRange(position, position);

        // Scroll para a linha
        const lineHeight = 21; // Aproximado
        this.textarea.scrollTop = (lineNumber - 5) * lineHeight;

        console.log('[LineCounter] Jumped to line:', lineNumber);
    },

    /**
     * Retorna a linha atual do cursor
     */
    getCurrentLine() {
        if (!this.textarea) return 1;

        const content = this.textarea.value;
        const cursorPosition = this.textarea.selectionStart;

        return content.substring(0, cursorPosition).split('\n').length;
    }
};

// Export global
window.LineCounter = LineCounter;
