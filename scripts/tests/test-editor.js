/**
 * CROMVA TEST - EDITOR MODULE
 * Testa CRUD de notas e funcionalidades do editor
 */

CromvaTest.register('editor', function () {
    const T = CromvaTest;

    T.suite('Editor - Funções Existem', () => {
        T.assertType(window.renderNotes, 'function', 'renderNotes');
        T.assertType(window.openPreview, 'function', 'openPreview');
        T.assertType(window.closePreview, 'function', 'closePreview');
        T.assertType(window.saveCurrentNote, 'function', 'saveCurrentNote');
        T.assertType(window.quickSaveNote, 'function', 'quickSaveNote');
        T.assertType(window.updatePreviewRender, 'function', 'updatePreviewRender');
        T.assertType(window.updateSaveButtonState, 'function', 'updateSaveButtonState');
    });

    T.suite('Editor - Elementos DOM', () => {
        T.assertExists(document.getElementById('notes-grid'), '#notes-grid');
        T.assertExists(document.getElementById('preview-modal'), '#preview-modal');
        T.assertExists(document.getElementById('modal-textarea'), '#modal-textarea');
        T.assertExists(document.getElementById('modal-title-input'), '#modal-title-input');
        T.assertExists(document.getElementById('btn-save-note'), '#btn-save-note');
    });

    T.suite('Editor - Notas Existentes', () => {
        T.assert(Array.isArray(window.notes), 'notes é um array');

        if (window.notes.length > 0) {
            const note = window.notes[0];
            T.assertExists(note.id, 'Nota tem id');
            T.assertExists(note.title, 'Nota tem title');
            T.assertExists(note.content, 'Nota tem content');
            T.assertExists(note.category, 'Nota tem category');
            T.assertExists(note.date, 'Nota tem date');
        } else {
            T.fail('Nenhuma nota encontrada para testar');
        }
    });

    T.suite('Editor - Rastreamento de Alterações', () => {
        // Verificar variáveis de rastreamento
        T.assert(
            'originalNoteContent' in window,
            'originalNoteContent definido'
        );
        T.assert(
            'originalNoteTitle' in window,
            'originalNoteTitle definido'
        );
    });

    T.suite('Editor - Criar Nota (simulação)', () => {
        const countBefore = window.notes.length;

        // Criar nota de teste
        const testNote = T.mock.note({ title: '__TEST_NOTE__' });
        window.notes.push(testNote);

        T.assertEqual(
            window.notes.length,
            countBefore + 1,
            'Nota adicionada ao array'
        );

        // Cleanup
        window.notes = window.notes.filter(n => n.title !== '__TEST_NOTE__');
        T.assertEqual(
            window.notes.length,
            countBefore,
            'Nota de teste removida'
        );
    });
});
