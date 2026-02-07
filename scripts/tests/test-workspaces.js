/**
 * CROMVA TEST - WORKSPACES MODULE
 * Testa gerenciamento de workspaces
 */

CromvaTest.register('workspaces', function () {
    const T = CromvaTest;

    T.suite('Workspaces - Funções Existem', () => {
        T.assertType(window.openWorkspaceManager, 'function', 'openWorkspaceManager');
        T.assertType(window.closeWorkspaceManager, 'function', 'closeWorkspaceManager');
        T.assertType(window.renderWorkspaces, 'function', 'renderWorkspaces');
        T.assertType(window.switchWorkspace, 'function', 'switchWorkspace');
        T.assertType(window.renderExplorer, 'function', 'renderExplorer');
        T.assertType(window.triggerImportMenu, 'function', 'triggerImportMenu');
        T.assertType(window.handleImport, 'function', 'handleImport');
        T.assertType(window.triggerDeleteFile, 'function', 'triggerDeleteFile');
    });

    T.suite('Workspaces - Elementos DOM', () => {
        T.assertExists(document.getElementById('workspace-modal'), '#workspace-modal');
        T.assertExists(document.getElementById('workspace-list'), '#workspace-list');
        T.assertExists(document.getElementById('explorer-list'), '#explorer-list');
        T.assertExists(document.getElementById('new-workspace-modal'), '#new-workspace-modal');
        T.assertExists(document.getElementById('import-modal'), '#import-modal');
        T.assertExists(document.getElementById('delete-modal'), '#delete-modal');
    });

    T.suite('Workspaces - Estrutura de Dados', () => {
        T.assert(Array.isArray(window.workspaces), 'workspaces é array');
        T.assertType(window.workspaceFiles, 'object', 'workspaceFiles é object');
        T.assertExists(window.currentWorkspaceId, 'currentWorkspaceId definido');
    });

    T.suite('Workspaces - Integridade', () => {
        window.workspaces.forEach(ws => {
            T.assertExists(ws.id, `Workspace "${ws.name}" tem id`);
            T.assertExists(ws.name, `Workspace "${ws.name}" tem name`);
            T.assertExists(ws.date, `Workspace "${ws.name}" tem date`);
            T.assertExists(ws.color, `Workspace "${ws.name}" tem color`);
        });
    });

    T.suite('Workspaces - Current Workspace', () => {
        const current = window.workspaces.find(w => w.id === window.currentWorkspaceId);
        if (current) {
            T.pass(`Workspace ativo: ${current.name}`);
        } else {
            T.fail('Nenhum workspace ativo encontrado');
        }
    });

    T.suite('Workspaces - Arquivos', () => {
        let totalFiles = 0;
        for (const wsId in window.workspaceFiles) {
            const files = window.workspaceFiles[wsId];
            if (Array.isArray(files)) {
                totalFiles += files.length;
            }
        }
        T.pass(`${totalFiles} arquivos totais em todos workspaces`);
    });
});
