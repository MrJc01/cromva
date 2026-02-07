/**
 * Cromva Modal de Confirmação
 * Modal genérico para confirmações de ações destrutivas
 */

const ConfirmModal = {
    /**
     * Mostra modal de confirmação
     * @param {Object} options
     * @param {string} options.title - Título do modal
     * @param {string} options.message - Mensagem de confirmação
     * @param {string} options.confirmText - Texto do botão confirmar (default: 'Confirmar')
     * @param {string} options.cancelText - Texto do botão cancelar (default: 'Cancelar')
     * @param {string} options.type - Tipo: 'danger' | 'warning' | 'info' (default: 'danger')
     * @returns {Promise<boolean>} - true se confirmou, false se cancelou
     */
    show(options = {}) {
        return new Promise((resolve) => {
            const {
                title = 'Confirmar Ação',
                message = 'Tem certeza que deseja continuar?',
                confirmText = 'Confirmar',
                cancelText = 'Cancelar',
                type = 'danger'
            } = options;

            // Cores baseadas no tipo
            const colors = {
                danger: {
                    icon: '⚠️',
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/30',
                    button: 'bg-red-600 hover:bg-red-500'
                },
                warning: {
                    icon: '⚡',
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500/30',
                    button: 'bg-amber-600 hover:bg-amber-500'
                },
                info: {
                    icon: 'ℹ️',
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/30',
                    button: 'bg-blue-600 hover:bg-blue-500'
                }
            };

            const c = colors[type] || colors.danger;

            const html = `
                <div id="confirm-modal-overlay" 
                     class="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center animate-fade-in"
                     onclick="if(event.target === this) ConfirmModal._resolve(false)">
                    <div class="bg-zinc-900 border ${c.border} rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl transform scale-100 animate-scale-in">
                        <!-- Header -->
                        <div class="flex items-start gap-4 mb-4">
                            <div class="${c.bg} p-3 rounded-full text-2xl">${c.icon}</div>
                            <div>
                                <h3 class="text-lg font-semibold text-white">${title}</h3>
                                <p class="text-zinc-400 text-sm mt-1">${message}</p>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex justify-end gap-3 mt-6">
                            <button id="confirm-modal-cancel"
                                    class="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
                                ${cancelText}
                            </button>
                            <button id="confirm-modal-confirm"
                                    class="px-4 py-2 text-sm font-medium text-white ${c.button} rounded-lg transition-colors">
                                ${confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Adicionar ao DOM
            document.body.insertAdjacentHTML('beforeend', html);

            // Guardar resolver para access global
            this._resolve = (result) => {
                const overlay = document.getElementById('confirm-modal-overlay');
                if (overlay) {
                    overlay.classList.add('animate-fade-out');
                    setTimeout(() => overlay.remove(), 150);
                }
                resolve(result);
            };

            // Event listeners
            document.getElementById('confirm-modal-cancel').addEventListener('click', () => {
                this._resolve(false);
            });

            document.getElementById('confirm-modal-confirm').addEventListener('click', () => {
                this._resolve(true);
            });

            // Escape para cancelar
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    this._resolve(false);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);

            // Focus no botão de cancelar (seguro por padrão)
            setTimeout(() => {
                document.getElementById('confirm-modal-cancel')?.focus();
            }, 50);
        });
    },

    /**
     * Atalhos para tipos comuns
     */
    async danger(title, message) {
        return this.show({ title, message, type: 'danger' });
    },

    async warning(title, message) {
        return this.show({ title, message, type: 'warning' });
    },

    async confirm(message) {
        return this.show({ message });
    },

    /**
     * Modal de confirmação para deletar
     */
    async confirmDelete(itemName) {
        return this.show({
            title: 'Deletar Item',
            message: `Tem certeza que deseja deletar "${itemName}"? Esta ação não pode ser desfeita.`,
            confirmText: 'Deletar',
            type: 'danger'
        });
    }
};

// Adicionar estilos de animação se não existirem
if (!document.getElementById('confirm-modal-styles')) {
    const style = document.createElement('style');
    style.id = 'confirm-modal-styles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        @keyframes scaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.15s ease-out; }
        .animate-fade-out { animation: fadeOut 0.15s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.2s ease-out; }
    `;
    document.head.appendChild(style);
}

// Export global
window.ConfirmModal = ConfirmModal;
