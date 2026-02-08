/**
 * Cromva File Sorting
 * Sistema de ordenação de arquivos e notas
 */

const FileSorter = {
    // Estado atual de ordenação
    currentSort: {
        field: 'date',  // 'name' | 'date' | 'size' | 'type'
        direction: 'desc'  // 'asc' | 'desc'
    },

    /**
     * Ordena array de notas
     * @param {Array} notes - Array de notas
     * @param {string} field - Campo para ordenar
     * @param {string} direction - 'asc' ou 'desc'
     */
    sortNotes(notes, field = this.currentSort.field, direction = this.currentSort.direction) {
        const sorted = [...notes];

        sorted.sort((a, b) => {
            let comparison = 0;

            switch (field) {
                case 'name':
                case 'title':
                    comparison = (a.title || a.name || '').localeCompare(b.title || b.name || '');
                    break;

                case 'date':
                    const dateA = new Date(a.date || a.updatedAt || 0).getTime();
                    const dateB = new Date(b.date || b.updatedAt || 0).getTime();
                    comparison = dateA - dateB;
                    break;

                case 'size':
                    const sizeA = (a.content || '').length;
                    const sizeB = (b.content || '').length;
                    comparison = sizeA - sizeB;
                    break;

                case 'category':
                    comparison = (a.category || '').localeCompare(b.category || '');
                    break;

                default:
                    comparison = 0;
            }

            return direction === 'desc' ? -comparison : comparison;
        });

        return sorted;
    },

    /**
     * Ordena array de arquivos
     */
    sortFiles(files, field = this.currentSort.field, direction = this.currentSort.direction) {
        const sorted = [...files];

        sorted.sort((a, b) => {
            // Pastas primeiro
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;

            let comparison = 0;

            switch (field) {
                case 'name':
                    comparison = (a.name || '').localeCompare(b.name || '');
                    break;

                case 'date':
                    const dateA = a.lastModified || 0;
                    const dateB = b.lastModified || 0;
                    comparison = dateA - dateB;
                    break;

                case 'size':
                    comparison = (a.size || 0) - (b.size || 0);
                    break;

                case 'type':
                    const extA = a.name?.split('.').pop() || '';
                    const extB = b.name?.split('.').pop() || '';
                    comparison = extA.localeCompare(extB);
                    break;

                default:
                    comparison = 0;
            }

            return direction === 'desc' ? -comparison : comparison;
        });

        return sorted;
    },

    /**
     * Alterna direção da ordenação
     */
    toggleDirection() {
        this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        return this.currentSort.direction;
    },

    /**
     * Define campo de ordenação
     */
    setField(field) {
        if (this.currentSort.field === field) {
            this.toggleDirection();
        } else {
            this.currentSort.field = field;
            this.currentSort.direction = 'desc'; // Reset para desc
        }
        return this.currentSort;
    },

    /**
     * Renderiza botões de ordenação
     */
    createSortButtons(container, onSort) {
        const buttons = [
            { field: 'name', label: 'Nome', icon: '📝' },
            { field: 'date', label: 'Data', icon: '📅' },
            { field: 'size', label: 'Tamanho', icon: '📊' }
        ];

        let html = '<div class="flex items-center gap-2 p-2 border-b border-zinc-800">';
        html += '<span class="text-xs text-zinc-500">Ordenar:</span>';

        for (const btn of buttons) {
            const isActive = this.currentSort.field === btn.field;
            const activeClass = isActive ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white';
            const arrow = isActive ? (this.currentSort.direction === 'asc' ? '↑' : '↓') : '';

            html += `
                <button class="px-2 py-1 text-xs rounded ${activeClass} transition-colors"
                        data-sort-field="${btn.field}"
                        title="Ordenar por ${btn.label}">
                    ${btn.icon} ${btn.label} ${arrow}
                </button>
            `;
        }

        html += '</div>';

        if (typeof container === 'string') {
            container = document.getElementById(container);
        }

        if (container) {
            container.innerHTML = html;

            container.querySelectorAll('[data-sort-field]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const field = btn.dataset.sortField;
                    this.setField(field);
                    this.createSortButtons(container, onSort);
                    if (onSort) onSort(this.currentSort);
                });
            });
        }

        return html;
    },

    /**
     * Aplica ordenação às notas globais e re-renderiza
     */
    applySortToNotes() {
        const sorted = this.sortNotes(window.notes);
        window.notes = sorted;
        if (typeof renderNotes === 'function') {
            renderNotes();
        }
    }
};

// Export global
window.FileSorter = FileSorter;
