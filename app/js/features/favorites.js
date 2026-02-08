/**
 * Cromva Favorites/Pins
 * Sistema de favoritos para notas
 */

const Favorites = {
    STORAGE_KEY: 'cromva-favorites',
    favorites: new Set(),

    /**
     * Inicializa o sistema de favoritos
     */
    init() {
        this.load();
        console.log('[Favorites] Initialized with', this.favorites.size, 'items');
    },

    /**
     * Carrega favoritos do localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                this.favorites = new Set(JSON.parse(saved));
            }
        } catch (e) {
            console.error('[Favorites] Error loading:', e);
        }
    },

    /**
     * Salva favoritos no localStorage
     */
    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([...this.favorites]));
        } catch (e) {
            console.error('[Favorites] Error saving:', e);
        }
    },

    /**
     * Adiciona um item aos favoritos
     */
    add(id) {
        id = Number(id);
        this.favorites.add(id);
        this.save();

        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('favorites:added', { id });
        }

        showToast('Adicionado aos favoritos ⭐');
        console.log('[Favorites] Added:', id);
    },

    /**
     * Remove um item dos favoritos
     */
    remove(id) {
        id = Number(id);
        this.favorites.delete(id);
        this.save();

        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('favorites:removed', { id });
        }

        showToast('Removido dos favoritos');
        console.log('[Favorites] Removed:', id);
    },

    /**
     * Alterna estado de favorito
     */
    toggle(id) {
        id = Number(id);
        if (this.isFavorite(id)) {
            this.remove(id);
            return false;
        } else {
            this.add(id);
            return true;
        }
    },

    /**
     * Verifica se é favorito
     */
    isFavorite(id) {
        return this.favorites.has(Number(id));
    },

    /**
     * Lista todos os IDs favoritos
     */
    getAll() {
        return [...this.favorites];
    },

    /**
     * Obtém notas favoritas
     */
    getFavoriteNotes() {
        const notes = window.notes || [];
        return notes.filter(n => this.isFavorite(n.id));
    },

    /**
     * Ordena notas colocando favoritos primeiro
     */
    sortWithFavoritesFirst(notes) {
        return [...notes].sort((a, b) => {
            const aFav = this.isFavorite(a.id) ? 0 : 1;
            const bFav = this.isFavorite(b.id) ? 0 : 1;

            if (aFav !== bFav) return aFav - bFav;

            // Secondary sort by date
            return new Date(b.date || 0) - new Date(a.date || 0);
        });
    },

    /**
     * Cria botão de favorito
     */
    createButton(id, options = {}) {
        const { size = 'sm', showLabel = false } = options;
        const isFav = this.isFavorite(id);

        const sizeClasses = {
            sm: 'w-5 h-5',
            md: 'w-6 h-6',
            lg: 'w-8 h-8'
        };

        const html = `
            <button class="favorite-btn ${isFav ? 'text-yellow-400' : 'text-zinc-500'} hover:text-yellow-400 transition-colors"
                    data-note-id="${id}"
                    title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                <svg class="${sizeClasses[size]}" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
                ${showLabel ? `<span class="ml-1 text-xs">${isFav ? 'Favorito' : 'Favoritar'}</span>` : ''}
            </button>
        `;

        return html;
    },

    /**
     * Adiciona listener a botões de favorito
     */
    attachListeners(container) {
        const buttons = container.querySelectorAll('.favorite-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.noteId;
                const isFav = this.toggle(id);

                // Atualizar visual
                btn.classList.toggle('text-yellow-400', isFav);
                btn.classList.toggle('text-zinc-500', !isFav);
                btn.querySelector('svg').setAttribute('fill', isFav ? 'currentColor' : 'none');
            });
        });
    },

    /**
     * Limpa todos os favoritos
     */
    clearAll() {
        this.favorites.clear();
        this.save();
        showToast('Favoritos limpos');
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Favorites.init());
} else {
    Favorites.init();
}

// Export global
window.Favorites = Favorites;
