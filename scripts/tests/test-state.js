/**
 * CROMVA TEST - STATE MODULE
 * Testa persistência e gerenciamento de estado
 */

CromvaTest.register('state', function () {
    const T = CromvaTest;

    T.suite('State - Variáveis Globais', () => {
        T.assertExists(window.notes, 'window.notes');
        T.assertExists(window.workspaces, 'window.workspaces');
        T.assertExists(window.workspaceFiles, 'window.workspaceFiles');
        T.assertType(window.notes, 'object', 'notes é array/object');
        T.assertType(window.workspaces, 'object', 'workspaces é array/object');
    });

    T.suite('State - Funções', () => {
        T.assertType(window.saveData, 'function', 'saveData existe');
        T.assertType(window.loadData, 'function', 'loadData existe');
    });

    T.suite('State - LocalStorage', () => {
        const raw = localStorage.getItem('cromvaData');
        T.assertExists(raw, 'cromvaData existe no localStorage');

        try {
            const data = JSON.parse(raw);
            T.assertExists(data.notes, 'data.notes existe');
            T.assertExists(data.workspaces, 'data.workspaces existe');
            T.pass('JSON válido no localStorage');
        } catch (e) {
            T.fail('JSON inválido no localStorage: ' + e.message);
        }
    });

    T.suite('State - Workspace Padrão', () => {
        T.assert(window.workspaces.length >= 1, 'Pelo menos 1 workspace existe');

        const principal = window.workspaces.find(w => w.name === 'Principal');
        if (principal) {
            T.pass('Workspace "Principal" encontrado');
            T.assertExists(principal.id, 'Principal tem id');
            T.assertExists(principal.date, 'Principal tem date');
        } else {
            T.fail('Workspace "Principal" não encontrado');
        }
    });

    T.suite('State - Integridade', () => {
        // Verificar se todos os workspaces têm arquivos associados
        window.workspaces.forEach(ws => {
            const files = window.workspaceFiles[ws.id];
            if (files !== undefined) {
                T.pass(`Workspace ${ws.id} tem workspaceFiles`);
            } else {
                T.fail(`Workspace ${ws.id} sem workspaceFiles`);
            }
        });
    });
});
