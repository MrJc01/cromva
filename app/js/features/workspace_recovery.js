
// Recuperação Automática de Workspaces Vazios
async function autoRecoverWorkspaceFiles() {
    if (!window.workspaces || !window.FSHandler) return;

    let recoveredCount = 0;

    for (const ws of window.workspaces) {
        // Se a lista de arquivos estiver vazia ou indefinida
        if (!window.workspaceFiles[ws.id] || window.workspaceFiles[ws.id].length === 0) {
            // Verifica se tem handle salvo
            const handle = FSHandler.handles[ws.id];
            if (handle) {
                console.log(`[Recovery] Workspace "${ws.name}" (${ws.id}) appears empty but has handle. Attempting recovery...`);
                try {
                    // Tentar ler diretório novamente
                    const files = await FSHandler.readDirectory(handle);
                    if (files && files.length > 0) {
                        window.workspaceFiles[ws.id] = files;
                        console.log(`[Recovery] Recovered ${files.length} files for workspace "${ws.name}"`);

                        // Tentar sincronizar notas se necessário
                        // await FSHandler.syncFilesToNotes(ws.id); // Pode ser pesado, mas seguro

                        recoveredCount++;
                    }
                } catch (e) {
                    console.error(`[Recovery] Failed to recover workspace "${ws.name}":`, e);
                }
            }
        }
    }

    if (recoveredCount > 0) {
        saveData();
        if (window.currentWorkspaceId && window.workspaceFiles[window.currentWorkspaceId]) {
            renderExplorer(window.currentWorkspaceId);
        }
        showToast(`${recoveredCount} workspace(s) recuperado(s) com sucesso.`);
    }
}

// Chamar recuperação ao carregar (se FSHandler já estiver pronto)
// Adicionando listener para garantir
window.addEventListener('load', () => {
    // Dar um tempo para handles serem restaurados pelo IndexedDB
    setTimeout(() => {
        if (window.FSHandler && window.FSHandler.handles) {
            autoRecoverWorkspaceFiles();
        }
    }, 2000);
});
