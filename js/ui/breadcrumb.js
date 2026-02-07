/**
 * Cromva Breadcrumb Navigation
 * Sistema de breadcrumb para navegação em pastas
 */

const Breadcrumb = {
    // Estado atual do caminho
    currentPath: [],

    /**
     * Inicializa o breadcrumb
     */
    init(containerId) {
        this.container = typeof containerId === 'string'
            ? document.getElementById(containerId)
            : containerId;
        this.render();
    },

    /**
     * Define o caminho atual
     * @param {Array|string} path - Array de segmentos ou string com /
     */
    setPath(path) {
        if (typeof path === 'string') {
            this.currentPath = path.split('/').filter(Boolean);
        } else {
            this.currentPath = [...path];
        }
        this.render();
    },

    /**
     * Navega para um índice específico do caminho
     */
    navigateTo(index) {
        this.currentPath = this.currentPath.slice(0, index + 1);
        this.render();

        // Emitir evento
        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('breadcrumb:navigate', {
                path: this.currentPath,
                fullPath: this.getFullPath()
            });
        }

        return this.getFullPath();
    },

    /**
     * Retorna o caminho completo como string
     */
    getFullPath() {
        return this.currentPath.join('/');
    },

    /**
     * Adiciona um segmento ao caminho
     */
    push(segment) {
        this.currentPath.push(segment);
        this.render();
    },

    /**
     * Remove o último segmento
     */
    pop() {
        this.currentPath.pop();
        this.render();
        return this.getFullPath();
    },

    /**
     * Volta para o início (raiz)
     */
    goToRoot() {
        this.currentPath = [];
        this.render();

        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('breadcrumb:navigate', {
                path: [],
                fullPath: ''
            });
        }
    },

    /**
     * Renderiza o breadcrumb
     */
    render() {
        if (!this.container) return;

        let html = `
            <nav class="flex items-center gap-1 text-sm text-zinc-400 overflow-x-auto py-2">
                <button class="breadcrumb-item hover:text-white transition-colors flex items-center gap-1" data-index="-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                    <span>Início</span>
                </button>
        `;

        this.currentPath.forEach((segment, index) => {
            const isLast = index === this.currentPath.length - 1;
            const textClass = isLast ? 'text-white font-medium' : 'hover:text-white';

            html += `
                <span class="text-zinc-600">/</span>
                <button class="breadcrumb-item ${textClass} transition-colors truncate max-w-[150px]" 
                        data-index="${index}"
                        title="${segment}"
                        ${isLast ? 'disabled' : ''}>
                    ${segment}
                </button>
            `;
        });

        html += '</nav>';
        this.container.innerHTML = html;

        // Event listeners
        this.container.querySelectorAll('.breadcrumb-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                if (index === -1) {
                    this.goToRoot();
                } else {
                    this.navigateTo(index);
                }
            });
        });
    },

    /**
     * Cria breadcrumb em tempo real baseado em workspace
     */
    createForWorkspace(workspaceId, subPath = '') {
        const workspace = window.workspaces?.find(w => w.id === workspaceId);
        if (!workspace) return;

        const path = [workspace.name];
        if (subPath) {
            path.push(...subPath.split('/').filter(Boolean));
        }

        this.setPath(path);
    }
};

// Export global
window.Breadcrumb = Breadcrumb;
