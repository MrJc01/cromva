/**
 * Cromva Find and Replace
 * Busca e substituição no editor de texto
 */

const FindReplace = {
    textarea: null,
    container: null,
    isVisible: false,
    lastQuery: '',
    matches: [],
    currentMatch: 0,

    /**
     * Inicializa o componente
     */
    init(textareaId = 'modal-textarea') {
        this.textarea = typeof textareaId === 'string'
            ? document.getElementById(textareaId)
            : textareaId;

        this.createUI();
        this.registerShortcuts();

        console.log('[FindReplace] Initialized');
    },

    /**
     * Cria a interface do find/replace
     */
    createUI() {
        if (document.getElementById('find-replace-panel')) return;

        const html = `
            <div id="find-replace-panel" class="hidden fixed top-16 right-4 z-[80] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl p-4 w-80 animate-slide-down">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm font-medium text-zinc-200">Buscar e Substituir</span>
                    <button id="find-replace-close" class="text-zinc-500 hover:text-white">✕</button>
                </div>
                
                <div class="space-y-3">
                    <div class="relative">
                        <input type="text" 
                               id="find-input" 
                               placeholder="Buscar..."
                               class="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600">
                        <span id="find-count" class="absolute right-2 top-2 text-xs text-zinc-500"></span>
                    </div>
                    
                    <input type="text" 
                           id="replace-input" 
                           placeholder="Substituir por..."
                           class="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600">
                    
                    <div class="flex items-center gap-2">
                        <label class="flex items-center gap-1 text-xs text-zinc-400">
                            <input type="checkbox" id="find-case" class="rounded bg-zinc-800 border-zinc-600">
                            Case sensitive
                        </label>
                        <label class="flex items-center gap-1 text-xs text-zinc-400">
                            <input type="checkbox" id="find-regex" class="rounded bg-zinc-800 border-zinc-600">
                            Regex
                        </label>
                    </div>
                    
                    <div class="flex gap-2">
                        <button id="find-prev" class="flex-1 px-3 py-1.5 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700">◀ Anterior</button>
                        <button id="find-next" class="flex-1 px-3 py-1.5 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700">Próximo ▶</button>
                    </div>
                    
                    <div class="flex gap-2">
                        <button id="replace-one" class="flex-1 px-3 py-1.5 text-xs bg-zinc-700 text-zinc-200 rounded hover:bg-zinc-600">Substituir</button>
                        <button id="replace-all" class="flex-1 px-3 py-1.5 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-500">Substituir Todos</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        this.container = document.getElementById('find-replace-panel');

        // Event listeners
        document.getElementById('find-replace-close').addEventListener('click', () => this.hide());
        document.getElementById('find-input').addEventListener('input', () => this.find());
        document.getElementById('find-prev').addEventListener('click', () => this.findPrev());
        document.getElementById('find-next').addEventListener('click', () => this.findNext());
        document.getElementById('replace-one').addEventListener('click', () => this.replace());
        document.getElementById('replace-all').addEventListener('click', () => this.replaceAll());
    },

    /**
     * Mostra/esconde o painel
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    },

    /**
     * Mostra o painel
     */
    show() {
        if (!this.container) return;
        this.container.classList.remove('hidden');
        this.isVisible = true;
        document.getElementById('find-input').focus();
    },

    /**
     * Esconde o painel
     */
    hide() {
        if (!this.container) return;
        this.container.classList.add('hidden');
        this.isVisible = false;
        this.clearHighlights();
    },

    /**
     * Busca texto
     */
    find() {
        const query = document.getElementById('find-input').value;
        const caseSensitive = document.getElementById('find-case').checked;
        const isRegex = document.getElementById('find-regex').checked;

        if (!query || !this.textarea) {
            document.getElementById('find-count').textContent = '';
            return;
        }

        this.lastQuery = query;
        const text = this.textarea.value;
        this.matches = [];

        try {
            if (isRegex) {
                const flags = caseSensitive ? 'g' : 'gi';
                const regex = new RegExp(query, flags);
                let match;
                while ((match = regex.exec(text)) !== null) {
                    this.matches.push({ start: match.index, end: match.index + match[0].length });
                }
            } else {
                const searchText = caseSensitive ? text : text.toLowerCase();
                const searchQuery = caseSensitive ? query : query.toLowerCase();
                let pos = 0;
                while ((pos = searchText.indexOf(searchQuery, pos)) !== -1) {
                    this.matches.push({ start: pos, end: pos + query.length });
                    pos++;
                }
            }
        } catch (e) {
            console.error('[FindReplace] Invalid regex:', e);
        }

        document.getElementById('find-count').textContent =
            this.matches.length > 0 ? `${this.currentMatch + 1}/${this.matches.length}` : '0';

        if (this.matches.length > 0) {
            this.goToMatch(0);
        }
    },

    /**
     * Vai para um match específico
     */
    goToMatch(index) {
        if (this.matches.length === 0) return;

        this.currentMatch = index;
        if (this.currentMatch < 0) this.currentMatch = this.matches.length - 1;
        if (this.currentMatch >= this.matches.length) this.currentMatch = 0;

        const match = this.matches[this.currentMatch];
        this.textarea.focus();
        this.textarea.setSelectionRange(match.start, match.end);

        // Scroll para a posição
        const lineHeight = 21;
        const lineNumber = this.textarea.value.substring(0, match.start).split('\n').length;
        this.textarea.scrollTop = (lineNumber - 5) * lineHeight;

        document.getElementById('find-count').textContent =
            `${this.currentMatch + 1}/${this.matches.length}`;
    },

    /**
     * Próximo match
     */
    findNext() {
        this.goToMatch(this.currentMatch + 1);
    },

    /**
     * Match anterior
     */
    findPrev() {
        this.goToMatch(this.currentMatch - 1);
    },

    /**
     * Substitui ocorrência atual
     */
    replace() {
        if (this.matches.length === 0 || !this.textarea) return;

        const replaceWith = document.getElementById('replace-input').value;
        const match = this.matches[this.currentMatch];

        const text = this.textarea.value;
        this.textarea.value =
            text.substring(0, match.start) +
            replaceWith +
            text.substring(match.end);

        // Re-buscar
        this.find();

        // Disparar evento
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }));

        showToast('Substituído');
    },

    /**
     * Substitui todas as ocorrências
     */
    replaceAll() {
        if (this.matches.length === 0 || !this.textarea) return;

        const query = document.getElementById('find-input').value;
        const replaceWith = document.getElementById('replace-input').value;
        const caseSensitive = document.getElementById('find-case').checked;
        const isRegex = document.getElementById('find-regex').checked;

        const count = this.matches.length;

        try {
            if (isRegex) {
                const flags = caseSensitive ? 'g' : 'gi';
                const regex = new RegExp(query, flags);
                this.textarea.value = this.textarea.value.replace(regex, replaceWith);
            } else {
                const flags = caseSensitive ? 'g' : 'gi';
                const regex = new RegExp(this.escapeRegex(query), flags);
                this.textarea.value = this.textarea.value.replace(regex, replaceWith);
            }
        } catch (e) {
            console.error('[FindReplace] Replace error:', e);
            return;
        }

        this.matches = [];
        this.currentMatch = 0;
        document.getElementById('find-count').textContent = '0';

        // Disparar evento
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }));

        showToast(`${count} substituições`);
    },

    /**
     * Escape regex
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    /**
     * Limpa highlights
     */
    clearHighlights() {
        // Placeholder para future implementação de highlights visuais
    },

    /**
     * Registra atalhos
     */
    registerShortcuts() {
        if (typeof KeyboardManager === 'undefined') return;

        KeyboardManager.register('ctrl+f', () => this.toggle(), {
            name: 'Buscar',
            global: true
        });
        KeyboardManager.register('ctrl+h', () => {
            this.show();
            document.getElementById('replace-input').focus();
        }, {
            name: 'Buscar e Substituir',
            global: true
        });
    }
};

// Export global
window.FindReplace = FindReplace;
