/**
 * CROMVA TEST - INTEGRATION
 * Testa fluxos completos end-to-end
 */

CromvaTest.register('integration', function () {
    const T = CromvaTest;

    T.suite('Integration - Criar e Deletar Nota', () => {
        const countBefore = window.notes.length;

        // Criar nota
        const testNote = T.mock.note({
            id: Date.now(),
            title: '__INTEGRATION_TEST__'
        });
        window.notes.push(testNote);

        T.assertEqual(window.notes.length, countBefore + 1, 'Nota criada');

        // Verificar que existe
        const found = window.notes.find(n => n.title === '__INTEGRATION_TEST__');
        T.assertExists(found, 'Nota encontrada por título');

        // Deletar
        window.notes = window.notes.filter(n => n.id !== testNote.id);
        T.assertEqual(window.notes.length, countBefore, 'Nota deletada');
    });

    T.suite('Integration - Persistência', () => {
        const originalNotes = [...window.notes];

        // Salvar
        saveData();
        T.pass('saveData executado');

        // Verificar localStorage
        const raw = localStorage.getItem('cromvaData');
        T.assertExists(raw, 'Dados persistidos');

        const data = JSON.parse(raw);
        T.assertEqual(data.notes.length, originalNotes.length, 'Quantidade de notas mantida');
    });

    T.suite('Integration - Navegação de Views', () => {
        const views = ['grid', 'graph', 'canvas', 'visuals'];

        views.forEach(view => {
            switchView(view);
            const el = document.getElementById(`view-${view}`);
            T.assert(el.classList.contains('active'), `View ${view} ativada`);
        });

        // Voltar para grid
        switchView('grid');
    });

    T.suite('Integration - Toast', () => {
        showToast('Test message');

        const toast = document.getElementById('toast');
        const msg = document.getElementById('toast-msg');

        T.assert(toast.classList.contains('show'), 'Toast visível');
        T.assertEqual(msg.innerText, 'Test message', 'Mensagem correta');
    });

    T.suite('Integration - Workspace Switch', () => {
        if (window.workspaces.length > 0) {
            const firstWs = window.workspaces[0];
            switchWorkspace(firstWs.id);
            T.assertEqual(window.currentWorkspaceId, firstWs.id, 'Workspace trocado');
        } else {
            T.fail('Nenhum workspace para testar');
        }
    });
});
