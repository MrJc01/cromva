/**
 * CROMVA TEST - UI/NAVIGATION MODULE
 * Testa navegação e componentes de UI
 */

CromvaTest.register('navigation', function () {
    const T = CromvaTest;

    T.suite('Navigation - Funções Existem', () => {
        T.assertType(window.switchView, 'function', 'switchView');
        T.assertType(window.toggleSidebar, 'function', 'toggleSidebar');
        T.assertType(window.toggleFullscreen, 'function', 'toggleFullscreen');
    });

    T.suite('Navigation - Elementos DOM', () => {
        T.assertExists(document.getElementById('sidebar'), '#sidebar');
        T.assertExists(document.getElementById('nav-grid'), '#nav-grid');
        T.assertExists(document.getElementById('nav-graph'), '#nav-graph');
        T.assertExists(document.getElementById('nav-canvas'), '#nav-canvas');
        T.assertExists(document.getElementById('nav-visuals'), '#nav-visuals');
        T.assertExists(document.getElementById('view-grid'), '#view-grid');
        T.assertExists(document.getElementById('view-graph'), '#view-graph');
        T.assertExists(document.getElementById('view-canvas'), '#view-canvas');
        T.assertExists(document.getElementById('view-visuals'), '#view-visuals');
    });

    T.suite('Navigation - Views', () => {
        const views = ['grid', 'graph', 'canvas', 'visuals'];
        let activeCount = 0;

        views.forEach(v => {
            const el = document.getElementById(`view-${v}`);
            if (el && el.classList.contains('active')) {
                activeCount++;
                T.pass(`View "${v}" está ativa`);
            }
        });

        T.assertEqual(activeCount, 1, 'Apenas 1 view ativa');
    });

    T.suite('Navigation - Toast', () => {
        T.assertType(window.showToast, 'function', 'showToast existe');
        T.assertExists(document.getElementById('toast'), '#toast');
        T.assertExists(document.getElementById('toast-msg'), '#toast-msg');
    });
});
