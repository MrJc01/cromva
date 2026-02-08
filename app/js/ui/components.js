/**
 * Cromva UI Components
 * Componentes reutilizáveis: loading states, skeleton loaders, tooltips
 */

const CromvaUI = {
    // --- LOADING STATES ---

    /**
     * Mostra overlay de loading
     * @param {string} message - Mensagem a exibir
     * @returns {Function} - Função para remover o loading
     */
    showLoading(message = 'Carregando...') {
        const id = 'loading-overlay-' + Date.now();

        const html = `
            <div id="${id}" class="fixed inset-0 bg-black/70 z-[90] flex items-center justify-center backdrop-blur-sm animate-fade-in">
                <div class="bg-zinc-900 border border-zinc-700 rounded-xl p-6 flex flex-col items-center gap-4 shadow-2xl">
                    <div class="loading-spinner w-10 h-10 border-4 border-zinc-600 border-t-emerald-500 rounded-full"></div>
                    <p class="text-zinc-300 text-sm font-medium">${message}</p>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        // Retorna função para remover
        return () => {
            const overlay = document.getElementById(id);
            if (overlay) {
                overlay.classList.add('animate-fade-out');
                setTimeout(() => overlay.remove(), 150);
            }
        };
    },

    /**
     * Adiciona spinner inline a um botão
     */
    buttonLoading(button, loading = true) {
        if (!button) return;

        if (loading) {
            button.dataset.originalText = button.innerHTML;
            button.disabled = true;
            button.innerHTML = `<span class="loading-spinner-small"></span>`;
        } else {
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
                delete button.dataset.originalText;
            }
            button.disabled = false;
        }
    },

    // --- SKELETON LOADERS ---

    /**
     * Cria skeleton loader para cards de nota
     */
    createNoteSkeletons(count = 6) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-card bg-zinc-900 rounded-xl p-4 border border-zinc-800 animate-pulse">
                    <div class="skeleton h-4 w-3/4 bg-zinc-700 rounded mb-2"></div>
                    <div class="skeleton h-3 w-1/2 bg-zinc-800 rounded mb-4"></div>
                    <div class="skeleton h-16 w-full bg-zinc-800 rounded mb-3"></div>
                    <div class="flex justify-between">
                        <div class="skeleton h-3 w-16 bg-zinc-800 rounded"></div>
                        <div class="skeleton h-3 w-12 bg-zinc-800 rounded"></div>
                    </div>
                </div>
            `;
        }
        return html;
    },

    /**
     * Mostra skeletons no grid de notas
     */
    showNoteSkeletons() {
        const grid = document.getElementById('notes-grid');
        if (grid) {
            grid.innerHTML = this.createNoteSkeletons(6);
        }
    },

    /**
     * Cria skeleton para lista de arquivos
     */
    createFileSkeletons(count = 5) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="skeleton-row flex items-center gap-3 px-4 py-3 border-b border-zinc-800 animate-pulse">
                    <div class="skeleton w-5 h-5 bg-zinc-700 rounded"></div>
                    <div class="skeleton flex-1 h-4 bg-zinc-700 rounded"></div>
                    <div class="skeleton w-12 h-4 bg-zinc-800 rounded"></div>
                </div>
            `;
        }
        return html;
    },

    // --- TOOLTIPS ---

    /**
     * Inicializa tooltips para elementos com data-tooltip
     */
    initTooltips() {
        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (!target) return;

            // Verificar se já existe tooltip
            if (document.getElementById('active-tooltip')) return;

            const text = target.dataset.tooltip;
            const position = target.dataset.tooltipPosition || 'top';

            this.showTooltip(target, text, position);
        });

        document.addEventListener('mouseout', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                this.hideTooltip();
            }
        });
    },

    /**
     * Mostra tooltip próximo ao elemento
     */
    showTooltip(element, text, position = 'top') {
        const rect = element.getBoundingClientRect();

        const tooltip = document.createElement('div');
        tooltip.id = 'active-tooltip';
        tooltip.className = 'fixed z-[100] px-2 py-1 text-xs text-white bg-zinc-800 border border-zinc-700 rounded shadow-lg pointer-events-none animate-fade-in';
        tooltip.style.maxWidth = '200px';
        tooltip.textContent = text;

        document.body.appendChild(tooltip);

        // Posicionar
        const tooltipRect = tooltip.getBoundingClientRect();
        let left, top;

        switch (position) {
            case 'bottom':
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                top = rect.bottom + 8;
                break;
            case 'left':
                left = rect.left - tooltipRect.width - 8;
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                break;
            case 'right':
                left = rect.right + 8;
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                break;
            default: // top
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                top = rect.top - tooltipRect.height - 8;
        }

        // Manter na tela
        left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
        top = Math.max(8, Math.min(top, window.innerHeight - tooltipRect.height - 8));

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    },

    /**
     * Esconde tooltip ativo
     */
    hideTooltip() {
        const tooltip = document.getElementById('active-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    },

    // --- TOAST MELHORADO ---

    /**
     * Toast com mais opções (ação, duração customizada, tipos)
     */
    toast(message, options = {}) {
        const {
            type = 'default',  // 'success' | 'error' | 'warning' | 'default'
            duration = 3000,
            action = null,     // { label: string, onClick: Function }
        } = options;

        const colors = {
            success: 'border-emerald-500 bg-emerald-500/10',
            error: 'border-red-500 bg-red-500/10',
            warning: 'border-amber-500 bg-amber-500/10',
            default: 'border-zinc-700 bg-zinc-900'
        };

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            default: 'ℹ'
        };

        const toastId = 'toast-' + Date.now();

        const actionHtml = action
            ? `<button onclick="${action.onClick}" class="text-emerald-400 hover:underline text-sm ml-4">${action.label}</button>`
            : '';

        const html = `
            <div id="${toastId}" class="fixed bottom-4 right-4 z-[80] ${colors[type]} border rounded-lg px-4 py-3 shadow-xl flex items-center gap-2 animate-slide-up">
                <span class="text-lg">${icons[type]}</span>
                <span class="text-zinc-200 text-sm">${message}</span>
                ${actionHtml}
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        setTimeout(() => {
            const toast = document.getElementById(toastId);
            if (toast) {
                toast.classList.add('animate-fade-out');
                setTimeout(() => toast.remove(), 150);
            }
        }, duration);
    }
};

// Adicionar estilos de animação
if (!document.getElementById('cromva-ui-styles')) {
    const style = document.createElement('style');
    style.id = 'cromva-ui-styles';
    style.textContent = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .loading-spinner {
            animation: spin 1s linear infinite;
        }
        .loading-spinner-small {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid currentColor;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        .animate-slide-up {
            animation: slideUp 0.3s ease-out;
        }
        .skeleton {
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
    `;
    document.head.appendChild(style);
}

// Auto-init tooltips
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CromvaUI.initTooltips());
} else {
    CromvaUI.initTooltips();
}

// Export global
window.CromvaUI = CromvaUI;
