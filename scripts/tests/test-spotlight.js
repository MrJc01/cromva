/**
 * CROMVA TEST - SPOTLIGHT MODULE
 * Testa busca e comandos
 */

CromvaTest.register('spotlight', function () {
    const T = CromvaTest;

    T.suite('Spotlight - Existência', () => {
        T.assertExists(window.SpotlightManager, 'SpotlightManager existe');
        T.assertType(SpotlightManager.init, 'function', 'init');
        T.assertType(SpotlightManager.open, 'function', 'open');
        T.assertType(SpotlightManager.close, 'function', 'close');
        T.assertType(SpotlightManager.toggle, 'function', 'toggle');
        T.assertType(SpotlightManager.handleInput, 'function', 'handleInput');
    });

    T.suite('Spotlight - Elementos DOM', () => {
        T.assertExists(document.getElementById('spotlight-overlay'), '#spotlight-overlay');
        T.assertExists(document.getElementById('spotlight-input'), '#spotlight-input');
        T.assertExists(document.getElementById('spotlight-results'), '#spotlight-results');
    });

    T.suite('Spotlight - Estado Inicial', () => {
        T.assertEqual(SpotlightManager.isOpen, false, 'isOpen é false');
        T.assertEqual(SpotlightManager.selectedIndex, 0, 'selectedIndex é 0');
        T.assert(Array.isArray(SpotlightManager.results), 'results é array');
    });

    T.suite('Spotlight - Overlay Fechado', () => {
        const overlay = document.getElementById('spotlight-overlay');
        const isHidden = overlay.classList.contains('hidden');
        T.assert(isHidden, 'Overlay está fechado inicialmente');
    });
});
