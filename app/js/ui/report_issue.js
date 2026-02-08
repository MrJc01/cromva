// --- REPORT ISSUE HANDLER ---
// Functions for the bug report modal

function openReportModal() {
    const modal = document.getElementById('report-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Clear previous inputs
    document.getElementById('report-subject').value = '';
    document.getElementById('report-description').value = '';

    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Focus on subject input
    setTimeout(() => {
        document.getElementById('report-subject').focus();
    }, 100);
}

function closeReportModal() {
    const modal = document.getElementById('report-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function submitReport() {
    const subject = document.getElementById('report-subject').value.trim() || 'Bug Report - Cromva';
    const description = document.getElementById('report-description').value.trim();

    // Collect system info
    const systemInfo = [
        `Versão: 1.0.0`,
        `Navegador: ${navigator.userAgent}`,
        `Plataforma: ${navigator.platform}`,
        `Data: ${new Date().toISOString()}`,
        `Tauri: ${window.Tauri && window.Tauri.isDesktop ? 'Sim' : 'Não'}`,
    ].join('\n');

    // Build email body
    const body = [
        '--- DESCRIÇÃO DO PROBLEMA ---',
        description || '(Nenhuma descrição fornecida)',
        '',
        '--- INFORMAÇÕES DO SISTEMA ---',
        systemInfo,
        '',
        '--- INSTRUÇÕES ---',
        'Por favor, anexe um screenshot do problema se possível.',
        'Você pode tirar um print (Ctrl+Shift+S ou PrtScn) e colar no email.',
    ].join('\n');

    // Encode for mailto
    const mailtoLink = `mailto:mrj.crom@gmail.com?subject=${encodeURIComponent('[Cromva Bug] ' + subject)}&body=${encodeURIComponent(body)}`;

    // Open email client
    window.open(mailtoLink, '_blank');

    // Close modal
    closeReportModal();

    // Show confirmation
    if (typeof showToast === 'function') {
        showToast('Email aberto! Cole um screenshot se necessário.');
    }
}

// Keyboard shortcut: ESC to close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('report-modal');
        if (modal && !modal.classList.contains('hidden')) {
            closeReportModal();
        }
    }
});
