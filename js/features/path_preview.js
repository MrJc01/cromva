/**
 * Cromva Path Preview
 * Preview do caminho completo com validação
 */

const PathPreview = {
    container: null,

    /**
     * Inicializa o componente
     */
    init(containerId = 'path-preview') {
        this.container = typeof containerId === 'string'
            ? document.getElementById(containerId)
            : containerId;

        console.log('[PathPreview] Initialized');
    },

    /**
     * Atualiza o preview do caminho
     */
    update(components) {
        if (!this.container) return;

        const path = components.filter(Boolean).join('/');
        const isValid = this.validate(path);

        this.container.innerHTML = `
            <div class="flex items-center gap-2 p-3 bg-zinc-800/50 rounded-lg border ${isValid ? 'border-zinc-700' : 'border-red-500/50'}">
                <span class="text-zinc-500">📂</span>
                <span class="flex-1 text-sm font-mono ${isValid ? 'text-zinc-300' : 'text-red-400'} truncate" title="${path}">
                    ${path || '/'}
                </span>
                ${isValid
                ? '<span class="text-emerald-500 text-sm">✓</span>'
                : '<span class="text-red-500 text-sm">✗</span>'
            }
            </div>
            ${!isValid ? `<p class="text-xs text-red-400 mt-1">${this.getValidationError(path)}</p>` : ''}
        `;
    },

    /**
     * Valida o caminho
     */
    validate(path) {
        if (!path) return true;  // Caminho vazio é válido (root)

        // Caracteres inválidos
        const invalidChars = /[<>:"|?*]/;
        if (invalidChars.test(path)) return false;

        // Segmentos vazios (// duplo)
        if (path.includes('//')) return false;

        // Nome muito longo
        const segments = path.split('/');
        for (const segment of segments) {
            if (segment.length > 255) return false;
        }

        return true;
    },

    /**
     * Retorna mensagem de erro de validação
     */
    getValidationError(path) {
        if (path.includes('//')) {
            return 'Caminho inválido: barras duplas';
        }

        const invalidChars = /[<>:"|?*]/;
        if (invalidChars.test(path)) {
            return 'Caracteres inválidos: < > : " | ? *';
        }

        const segments = path.split('/');
        for (const segment of segments) {
            if (segment.length > 255) {
                return 'Nome de pasta muito longo (máx 255 caracteres)';
            }
        }

        return 'Caminho inválido';
    },

    /**
     * Renderiza breadcrumb clicável
     */
    renderBreadcrumb(components, onClick) {
        if (!this.container) return;

        let html = '<div class="flex items-center gap-1 text-sm overflow-x-auto py-2">';

        html += `
            <button class="breadcrumb-segment px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded" data-index="-1">
                🏠
            </button>
        `;

        components.forEach((component, index) => {
            if (!component) return;

            html += `
                <span class="text-zinc-600">/</span>
                <button class="breadcrumb-segment px-2 py-1 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded truncate max-w-[120px]" 
                        data-index="${index}"
                        title="${component}">
                    ${component}
                </button>
            `;
        });

        html += '</div>';
        this.container.innerHTML = html;

        // Attach listeners
        if (onClick) {
            this.container.querySelectorAll('.breadcrumb-segment').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.dataset.index);
                    onClick(index);
                });
            });
        }
    }
};

// Export global
window.PathPreview = PathPreview;
