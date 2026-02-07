/**
 * CROMVA TEST - LOCATION PICKER MODULE
 * Testa seleção de local para salvar notas
 */

CromvaTest.register('location', function () {
    const T = CromvaTest;

    T.suite('LocationPicker - Existência', () => {
        T.assert(typeof LocationPicker !== 'undefined', 'LocationPicker existe');
        T.assertType(LocationPicker.open, 'function', 'open');
        T.assertType(LocationPicker.close, 'function', 'close');
        T.assertType(LocationPicker.confirm, 'function', 'confirm');
        T.assertType(LocationPicker.renderWorkspaces, 'function', 'renderWorkspaces');
        T.assertType(LocationPicker.renderFolders, 'function', 'renderFolders');
        T.assertType(LocationPicker.addFolderToCurrentWorkspace, 'function', 'addFolderToCurrentWorkspace');
    });

    T.suite('LocationPicker - Elementos DOM', () => {
        T.assertExists(document.getElementById('location-picker-modal'), '#location-picker-modal');
        T.assertExists(document.getElementById('lp-workspace-list'), '#lp-workspace-list');
        T.assertExists(document.getElementById('lp-folder-list'), '#lp-folder-list');
        T.assertExists(document.getElementById('current-location-label'), '#current-location-label');
        T.assertExists(document.getElementById('btn-location-picker'), '#btn-location-picker');
    });

    T.suite('LocationPicker - Estado Inicial', () => {
        T.assert(
            LocationPicker.selectedWorkspaceId === null ||
            typeof LocationPicker.selectedWorkspaceId === 'number',
            'selectedWorkspaceId é null ou number'
        );
        T.assert(
            LocationPicker.selectedFolderId === null ||
            typeof LocationPicker.selectedFolderId === 'number',
            'selectedFolderId é null ou number'
        );
    });

    T.suite('LocationPicker - Modal Fechado', () => {
        const modal = document.getElementById('location-picker-modal');
        const isHidden = modal.classList.contains('hidden');
        T.assert(isHidden, 'Modal está fechado inicialmente');
    });
});
