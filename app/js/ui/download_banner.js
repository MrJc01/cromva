// --- DOWNLOAD BANNER ---
// Shows a banner prompting users to download the desktop app when visiting via browser.

(function () {
    // Skip if running in Tauri or already dismissed
    if (window.Tauri && window.Tauri.isDesktop) return;
    if (localStorage.getItem('cromva_download_dismissed')) return;

    // Detect OS from User-Agent
    function detectOS() {
        const ua = navigator.userAgent;
        if (/Win/i.test(ua)) return 'Windows';
        if (/Mac/i.test(ua)) return 'macOS';
        if (/Linux/i.test(ua)) return 'Linux';
        return 'Unknown';
    }

    const os = detectOS();

    // Determine download link (Releases page)
    const downloads = {
        'Windows': 'https://github.com/MrJc01/cromva/releases',
        'macOS': 'https://github.com/MrJc01/cromva/releases',
        'Linux': 'https://github.com/MrJc01/cromva/releases',
    };

    setTimeout(() => {
        // Create banner element
        const banner = document.createElement('div');
        banner.id = 'download-banner';
        banner.className = 'fixed bottom-6 right-6 z-[9999] glass p-4 rounded-xl border border-zinc-700 shadow-2xl max-w-xs animate__animated animate__fadeInUp';
        banner.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-500 flex items-center justify-center shadow-lg shrink-0">
                    <i data-lucide="download" class="w-5 h-5 text-zinc-900"></i>
                </div>
                <div class="flex-1">
                    <h4 class="text-zinc-100 font-bold text-sm mb-1">Experiência Completa</h4>
                    <p class="text-zinc-400 text-xs mb-3">Baixe o app para ${os} para acesso offline e melhor performance.</p>
                    <div class="flex gap-2">
                        <a href="${downloads[os] || '#'}" target="_blank"
                            class="flex-1 text-center bg-blue-600 hover:bg-blue-500 text-white py-1.5 px-3 rounded text-xs font-semibold transition-colors">
                            Baixar para ${os}
                        </a>
                        <button id="btn-dismiss-download" class="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 transition-colors" title="Dispensar">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        // Re-initialize Lucide icons for the new element
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Dismiss handler
        document.getElementById('btn-dismiss-download').addEventListener('click', () => {
            localStorage.setItem('cromva_download_dismissed', 'true');
            banner.classList.add('animate__fadeOutDown');
            setTimeout(() => banner.remove(), 500);
        });

    }, 3000); // Show after 3 seconds
})();
