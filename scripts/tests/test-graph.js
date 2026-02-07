/**
 * CROMVA TEST - GRAPH MODULE
 * Testa visualização de grafo
 */

CromvaTest.register('graph', function () {
    const T = CromvaTest;

    T.suite('Graph - Funções Existem', () => {
        T.assertType(window.initGraph, 'function', 'initGraph');
    });

    T.suite('Graph - Variáveis', () => {
        T.assert(typeof graphAnimationId !== 'undefined', 'graphAnimationId definido');
        T.assert(typeof graphNodes !== 'undefined', 'graphNodes definido');
        T.assert(typeof globalHoveredNode !== 'undefined', 'globalHoveredNode definido');
    });

    T.suite('Graph - Elementos DOM', () => {
        T.assertExists(document.getElementById('view-graph'), '#view-graph');
        T.assertExists(document.getElementById('graph-canvas'), '#graph-canvas');
        T.assertExists(document.getElementById('graph-tooltip'), '#graph-tooltip');
    });

    T.suite('Graph - Canvas', () => {
        const canvas = document.getElementById('graph-canvas');
        if (canvas) {
            T.assertExists(canvas.getContext, 'canvas tem getContext');
            const ctx = canvas.getContext('2d');
            T.assertExists(ctx, 'contexto 2D disponível');
        }
    });
});
