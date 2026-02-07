/**
 * CROMVA TEST - CANVAS MODULE
 * Testa infinite canvas
 */

CromvaTest.register('canvas', function () {
    const T = CromvaTest;

    T.suite('Canvas - Funções Existem', () => {
        T.assertType(window.initCanvas, 'function', 'initCanvas');
        T.assertType(window.setupCanvasListeners, 'function', 'setupCanvasListeners');
        T.assertType(window.saveCanvasLayout, 'function', 'saveCanvasLayout');
        T.assertType(window.updateCanvasTransform, 'function', 'updateCanvasTransform');
        T.assertType(window.adjustZoom, 'function', 'adjustZoom');
        T.assertType(window.resetZoom, 'function', 'resetZoom');
    });

    T.suite('Canvas - Variáveis', () => {
        T.assert(typeof canvasState !== 'undefined', 'canvasState existe');
        T.assertType(canvasState.scale, 'number', 'canvasState.scale é number');
        T.assertType(canvasState.x, 'number', 'canvasState.x é number');
        T.assertType(canvasState.y, 'number', 'canvasState.y é number');
        T.assertType(canvasState.positions, 'object', 'canvasState.positions é object');
    });

    T.suite('Canvas - Elementos DOM', () => {
        T.assertExists(document.getElementById('view-canvas'), '#view-canvas');
        T.assertExists(document.getElementById('infinite-canvas'), '#infinite-canvas');
        T.assertExists(document.getElementById('zoom-level'), '#zoom-level');
    });

    T.suite('Canvas - LocalStorage', () => {
        const raw = localStorage.getItem('cromva_canvas_state');
        if (raw) {
            try {
                const state = JSON.parse(raw);
                T.assertExists(state.scale, 'scale salvo');
                T.assertExists(state.positions, 'positions salvo');
                T.pass('Canvas state válido no localStorage');
            } catch (e) {
                T.fail('Canvas state inválido: ' + e.message);
            }
        } else {
            T.pass('Canvas state usa defaults (não salvo ainda)');
        }
    });

    T.suite('Canvas - Zoom Controls', () => {
        const initialScale = canvasState.scale;

        adjustZoom(0.1);
        T.assertEqual(canvasState.scale, initialScale + 0.1, 'Zoom aumentou');

        adjustZoom(-0.1);
        T.assertEqual(canvasState.scale, initialScale, 'Zoom restaurado');
    });
});
