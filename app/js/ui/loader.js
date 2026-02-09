/**
 * Cromva Loading Screen
 * Gerencia a tela de carregamento inicial com animações e mensagens dinâmicas
 */

const Loader = {
    messages: [
        "Inicializando Kernel...",
        "Carregando Módulos de IA...",
        "Sincronizando Neural Canvas...",
        "Otimizando Fluxos de Trabalho...",
        "Renderizando Interface...",
        "Verificando Integridade...",
        "Preparando Ambiente...",
        "Quase lá..."
    ],

    init() {
        const loadingScreen = document.getElementById('loading-screen');
        const loadingText = document.getElementById('loading-text');

        if (!loadingScreen || !loadingText) return;

        // Cycle through messages
        let msgIndex = 0;
        const msgInterval = setInterval(() => {
            msgIndex = (msgIndex + 1) % this.messages.length;
            loadingText.style.opacity = 0;

            setTimeout(() => {
                loadingText.innerText = this.messages[msgIndex];
                loadingText.style.opacity = 1;
            }, 200);
        }, 800);

        // Remove loader when app is ready (simulated for now, or hooked to window.onload)
        // We'll use a minimum time to show off the animation
        const minTime = 2500; // 2.5s minimum
        const startTime = Date.now();

        const finishLoad = () => {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minTime - elapsedTime);

            setTimeout(() => {
                clearInterval(msgInterval);
                loadingScreen.classList.add('fade-out');

                // Allow interactions after fade
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    // Trigger entry animations for the app
                    document.body.classList.add('app-loaded');
                }, 500);
            }, remainingTime);
        };

        if (document.readyState === 'complete') {
            finishLoad();
        } else {
            window.addEventListener('load', finishLoad);
        }
    }
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => Loader.init());
