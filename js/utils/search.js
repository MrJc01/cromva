/**
 * Cromva File Search
 * Busca e filtro de arquivos e notas
 */

const FileSearch = {
    // Cache de resultados
    lastQuery: '',
    lastResults: [],

    /**
     * Busca em notas
     * @param {string} query - Termo de busca
     * @param {Array} notes - Array de notas (default: window.notes)
     * @returns {Array} Notas que correspondem à busca
     */
    searchNotes(query, notes = window.notes || []) {
        if (!query || query.trim() === '') {
            return notes;
        }

        const q = query.toLowerCase().trim();
        this.lastQuery = q;

        const results = notes.filter(note => {
            const title = (note.title || '').toLowerCase();
            const content = (note.content || '').toLowerCase();
            const category = (note.category || '').toLowerCase();

            return title.includes(q) || content.includes(q) || category.includes(q);
        });

        // Ordenar por relevância (título match primeiro)
        results.sort((a, b) => {
            const aTitle = (a.title || '').toLowerCase();
            const bTitle = (b.title || '').toLowerCase();
            const aInTitle = aTitle.includes(q);
            const bInTitle = bTitle.includes(q);

            if (aInTitle && !bInTitle) return -1;
            if (!aInTitle && bInTitle) return 1;
            return 0;
        });

        this.lastResults = results;
        return results;
    },

    /**
     * Busca em arquivos
     * @param {string} query - Termo de busca
     * @param {Array} files - Array de arquivos
     */
    searchFiles(query, files = []) {
        if (!query || query.trim() === '') {
            return files;
        }

        const q = query.toLowerCase().trim();

        return files.filter(file => {
            const name = (file.name || '').toLowerCase();
            return name.includes(q);
        });
    },

    /**
     * Filtra notas por categoria
     */
    filterByCategory(category, notes = window.notes || []) {
        if (!category || category === 'all') {
            return notes;
        }
        return notes.filter(n => n.category === category);
    },

    /**
     * Filtra notas por data
     * @param {string} period - 'today' | 'week' | 'month' | 'year'
     */
    filterByDate(period, notes = window.notes || []) {
        const now = new Date();
        let cutoff;

        switch (period) {
            case 'today':
                cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                cutoff = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                return notes;
        }

        return notes.filter(n => {
            const date = new Date(n.date || n.updatedAt || 0);
            return date >= cutoff;
        });
    },

    /**
     * Lista todas as categorias únicas
     */
    getCategories(notes = window.notes || []) {
        const categories = new Set();
        notes.forEach(n => {
            if (n.category) categories.add(n.category);
        });
        return Array.from(categories).sort();
    },

    /**
     * Cria barra de busca
     * @param {Function} onSearch - Callback quando buscar
     */
    createSearchBar(containerId, onSearch) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const html = `
            <div class="relative">
                <input type="text" 
                       id="file-search-input"
                       placeholder="Buscar..." 
                       class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 pl-10 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600">
                <svg class="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <button id="file-search-clear" class="absolute right-3 top-2.5 text-zinc-500 hover:text-white hidden">✕</button>
            </div>
        `;

        container.innerHTML = html;

        const input = document.getElementById('file-search-input');
        const clearBtn = document.getElementById('file-search-clear');

        // Debounce para não buscar a cada tecla
        let debounceTimer;
        input.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const query = input.value;
                clearBtn.classList.toggle('hidden', query === '');
                if (onSearch) onSearch(query);
            }, 200);
        });

        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.classList.add('hidden');
            if (onSearch) onSearch('');
        });
    },

    /**
     * Cria filtros de categoria
     */
    createCategoryFilter(containerId, onFilter) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const categories = this.getCategories();

        let html = '<div class="flex flex-wrap gap-2">';
        html += '<button class="category-filter px-2 py-1 text-xs rounded bg-zinc-700 text-white" data-category="all">Todas</button>';

        for (const cat of categories) {
            html += `<button class="category-filter px-2 py-1 text-xs rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white" data-category="${cat}">${cat}</button>`;
        }

        html += '</div>';
        container.innerHTML = html;

        container.querySelectorAll('.category-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                // Atualizar estilos
                container.querySelectorAll('.category-filter').forEach(b => {
                    b.classList.remove('bg-zinc-700', 'text-white');
                    b.classList.add('bg-zinc-800', 'text-zinc-400');
                });
                btn.classList.remove('bg-zinc-800', 'text-zinc-400');
                btn.classList.add('bg-zinc-700', 'text-white');

                if (onFilter) onFilter(btn.dataset.category);
            });
        });
    },

    /**
     * Destaca termo de busca no texto
     */
    highlight(text, query) {
        if (!query || !text) return text;

        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-500/30 text-yellow-200">$1</mark>');
    },

    /**
     * Escape caracteres especiais de regex
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
};

// Export global
window.FileSearch = FileSearch;
