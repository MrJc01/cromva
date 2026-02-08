/**
 * Cromva Animations
 * Animações de transição suaves para a aplicação
 */

const CromvaAnimations = {
    /**
     * Inicializa as animações
     */
    init() {
        this.injectStyles();
        console.log('[Animations] Initialized');
    },

    /**
     * Injeta estilos CSS de animação
     */
    injectStyles() {
        if (document.getElementById('cromva-animations-styles')) return;

        const style = document.createElement('style');
        style.id = 'cromva-animations-styles';
        style.textContent = `
            /* === TRANSIÇÕES SUAVES === */
            
            /* Fade In/Out */
            .animate-fade-in {
                animation: fadeIn 0.2s ease-out forwards;
            }
            .animate-fade-out {
                animation: fadeOut 0.2s ease-out forwards;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }

            /* Scale In/Out */
            .animate-scale-in {
                animation: scaleIn 0.2s ease-out forwards;
            }
            .animate-scale-out {
                animation: scaleOut 0.15s ease-in forwards;
            }
            
            @keyframes scaleIn {
                from { transform: scale(0.95); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            @keyframes scaleOut {
                from { transform: scale(1); opacity: 1; }
                to { transform: scale(0.95); opacity: 0; }
            }

            /* Slide animations */
            .animate-slide-up {
                animation: slideUp 0.3s ease-out forwards;
            }
            .animate-slide-down {
                animation: slideDown 0.3s ease-out forwards;
            }
            .animate-slide-left {
                animation: slideLeft 0.3s ease-out forwards;
            }
            .animate-slide-right {
                animation: slideRight 0.3s ease-out forwards;
            }
            
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes slideDown {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes slideLeft {
                from { transform: translateX(20px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideRight {
                from { transform: translateX(-20px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            /* Bounce */
            .animate-bounce {
                animation: bounce 0.5s ease-out;
            }
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            /* Pulse */
            .animate-pulse {
                animation: pulse 2s ease-in-out infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            /* Shake (for errors) */
            .animate-shake {
                animation: shake 0.5s ease-in-out;
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                20%, 60% { transform: translateX(-5px); }
                40%, 80% { transform: translateX(5px); }
            }

            /* Spin */
            .animate-spin {
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            /* === TRANSIÇÕES DE PÁGINA === */
            
            .page-transition-enter {
                opacity: 0;
                transform: translateY(10px);
            }
            .page-transition-enter-active {
                opacity: 1;
                transform: translateY(0);
                transition: opacity 0.2s ease, transform 0.2s ease;
            }
            .page-transition-exit {
                opacity: 1;
                transform: translateY(0);
            }
            .page-transition-exit-active {
                opacity: 0;
                transform: translateY(-10px);
                transition: opacity 0.2s ease, transform 0.2s ease;
            }

            /* === HOVER EFFECTS === */
            
            .hover-lift {
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .hover-lift:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
            }

            .hover-scale {
                transition: transform 0.2s ease;
            }
            .hover-scale:hover {
                transform: scale(1.02);
            }

            .hover-glow {
                transition: box-shadow 0.2s ease;
            }
            .hover-glow:hover {
                box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
            }

            /* === CARD ANIMATIONS === */
            
            .note-card {
                transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
            }
            .note-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
                border-color: rgba(255, 255, 255, 0.1);
            }

            /* === MODAL ANIMATIONS === */
            
            .modal-backdrop {
                transition: opacity 0.2s ease;
            }
            .modal-content {
                transition: transform 0.2s ease, opacity 0.2s ease;
            }

            /* === SIDEBAR ANIMATION === */
            
            #file-sidebar {
                transition: transform 0.3s ease, opacity 0.3s ease;
            }
            #file-sidebar.collapsed {
                transform: translateX(-100%);
                opacity: 0;
            }

            /* === STAGGER CHILDREN === */
            
            .stagger-children > * {
                opacity: 0;
                animation: fadeIn 0.2s ease forwards;
            }
            .stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
            .stagger-children > *:nth-child(2) { animation-delay: 0.1s; }
            .stagger-children > *:nth-child(3) { animation-delay: 0.15s; }
            .stagger-children > *:nth-child(4) { animation-delay: 0.2s; }
            .stagger-children > *:nth-child(5) { animation-delay: 0.25s; }
            .stagger-children > *:nth-child(6) { animation-delay: 0.3s; }
        `;
        document.head.appendChild(style);
    },

    /**
     * Aplica animação a um elemento
     */
    animate(element, animation, duration = 200) {
        return new Promise(resolve => {
            if (typeof element === 'string') {
                element = document.querySelector(element);
            }
            if (!element) {
                resolve();
                return;
            }

            element.classList.add(`animate-${animation}`);

            setTimeout(() => {
                element.classList.remove(`animate-${animation}`);
                resolve();
            }, duration);
        });
    },

    /**
     * Transição entre estados
     */
    async transition(element, outAnimation, inAnimation) {
        await this.animate(element, outAnimation, 150);
        await this.animate(element, inAnimation, 200);
    },

    /**
     * Fade in um elemento
     */
    fadeIn(element) {
        return this.animate(element, 'fade-in', 200);
    },

    /**
     * Fade out um elemento
     */
    fadeOut(element) {
        return this.animate(element, 'fade-out', 200);
    },

    /**
     * Shake para indicar erro
     */
    shake(element) {
        return this.animate(element, 'shake', 500);
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CromvaAnimations.init());
} else {
    CromvaAnimations.init();
}

// Export global
window.CromvaAnimations = CromvaAnimations;
