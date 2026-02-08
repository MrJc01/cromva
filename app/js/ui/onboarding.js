/**
 * Cromva Onboarding Tour
 * Tour guiado para novos usuários
 */

const OnboardingTour = {
    STORAGE_KEY: 'cromva-onboarding-completed',
    currentStep: 0,
    overlay: null,

    steps: [
        {
            target: '#new-note-btn',
            title: 'Criar Nova Nota',
            content: 'Clique aqui para criar uma nova nota. Use Ctrl+N como atalho.',
            position: 'bottom'
        },
        {
            target: '#workspace-dropdown',
            title: 'Workspaces',
            content: 'Organize suas notas em workspaces. Conecte pastas locais do seu computador.',
            position: 'bottom'
        },
        {
            target: '#note-list',
            title: 'Lista de Notas',
            content: 'Suas notas aparecem aqui. Clique para editar, arraste para reorganizar.',
            position: 'right'
        },
        {
            target: '#modal-textarea',
            title: 'Editor Markdown',
            content: 'Escreva em Markdown. Use Ctrl+B para negrito, Ctrl+I para itálico.',
            position: 'left'
        },
        {
            target: '#view-graph-btn',
            title: 'Visualização em Grafo',
            content: 'Veja suas notas como um grafo de conexões.',
            position: 'bottom'
        },
        {
            target: null,
            title: '🎉 Pronto!',
            content: 'Você está pronto para usar o Cromva! Pressione Shift+? para ver todos os atalhos.',
            position: 'center'
        }
    ],

    /**
     * Verifica se deve mostrar o tour
     */
    shouldShow() {
        return !localStorage.getItem(this.STORAGE_KEY);
    },

    /**
     * Inicia o tour
     */
    start() {
        if (!this.shouldShow() && !this.forced) {
            console.log('[OnboardingTour] Already completed');
            return;
        }

        this.currentStep = 0;
        this.createOverlay();
        this.showStep(0);

        console.log('[OnboardingTour] Started');
    },

    /**
     * Força iniciar tour
     */
    forceStart() {
        this.forced = true;
        this.start();
    },

    /**
     * Cria overlay
     */
    createOverlay() {
        if (this.overlay) this.overlay.remove();

        this.overlay = document.createElement('div');
        this.overlay.id = 'onboarding-overlay';
        this.overlay.className = 'fixed inset-0 z-[100]';
        this.overlay.innerHTML = `
            <div class="absolute inset-0 bg-black/80"></div>
            <div id="onboarding-spotlight" class="absolute transition-all duration-300"></div>
            <div id="onboarding-tooltip" class="absolute z-10 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-5 max-w-sm transition-all duration-300">
                <h3 id="onboarding-title" class="text-lg font-bold text-white mb-2"></h3>
                <p id="onboarding-content" class="text-zinc-400 text-sm mb-4"></p>
                <div class="flex items-center justify-between">
                    <span id="onboarding-progress" class="text-xs text-zinc-500"></span>
                    <div class="flex gap-2">
                        <button id="onboarding-skip" class="px-3 py-1.5 text-xs text-zinc-500 hover:text-white">Pular</button>
                        <button id="onboarding-next" class="px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500">Próximo</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.overlay);

        // Event listeners
        document.getElementById('onboarding-next').addEventListener('click', () => this.next());
        document.getElementById('onboarding-skip').addEventListener('click', () => this.complete());
    },

    /**
     * Mostra um passo específico
     */
    showStep(index) {
        if (index >= this.steps.length) {
            this.complete();
            return;
        }

        this.currentStep = index;
        const step = this.steps[index];

        // Atualizar texto
        document.getElementById('onboarding-title').textContent = step.title;
        document.getElementById('onboarding-content').textContent = step.content;
        document.getElementById('onboarding-progress').textContent = `${index + 1} de ${this.steps.length}`;

        const nextBtn = document.getElementById('onboarding-next');
        nextBtn.textContent = index === this.steps.length - 1 ? 'Concluir' : 'Próximo';

        // Posicionar tooltip
        this.positionTooltip(step);
    },

    /**
     * Posiciona tooltip e spotlight
     */
    positionTooltip(step) {
        const tooltip = document.getElementById('onboarding-tooltip');
        const spotlight = document.getElementById('onboarding-spotlight');

        if (!step.target || step.position === 'center') {
            // Centralizado
            tooltip.style.left = '50%';
            tooltip.style.top = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            spotlight.style.display = 'none';
            return;
        }

        const target = document.querySelector(step.target);
        if (!target) {
            this.next();
            return;
        }

        const rect = target.getBoundingClientRect();

        // Spotlight
        spotlight.style.display = 'block';
        spotlight.style.left = `${rect.left - 8}px`;
        spotlight.style.top = `${rect.top - 8}px`;
        spotlight.style.width = `${rect.width + 16}px`;
        spotlight.style.height = `${rect.height + 16}px`;
        spotlight.style.boxShadow = '0 0 0 9999px rgba(0,0,0,0.85)';
        spotlight.style.borderRadius = '8px';

        // Tooltip position
        tooltip.style.transform = 'none';

        switch (step.position) {
            case 'bottom':
                tooltip.style.left = `${rect.left}px`;
                tooltip.style.top = `${rect.bottom + 16}px`;
                break;
            case 'top':
                tooltip.style.left = `${rect.left}px`;
                tooltip.style.top = `${rect.top - 200}px`;
                break;
            case 'left':
                tooltip.style.left = `${rect.left - 360}px`;
                tooltip.style.top = `${rect.top}px`;
                break;
            case 'right':
                tooltip.style.left = `${rect.right + 16}px`;
                tooltip.style.top = `${rect.top}px`;
                break;
        }
    },

    /**
     * Próximo passo
     */
    next() {
        this.showStep(this.currentStep + 1);
    },

    /**
     * Completa o tour
     */
    complete() {
        localStorage.setItem(this.STORAGE_KEY, 'true');

        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        this.forced = false;
        showToast('Tour concluído! 🎉');
        console.log('[OnboardingTour] Completed');
    },

    /**
     * Reseta o tour (para teste)
     */
    reset() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('[OnboardingTour] Reset');
    }
};

// Export global
window.OnboardingTour = OnboardingTour;
