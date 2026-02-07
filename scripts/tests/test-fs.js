/**
 * CROMVA TEST - FILE SYSTEM MODULE
 * Testa FSHandler e operações de arquivo
 */

CromvaTest.register('fs', function () {
    const T = CromvaTest;

    T.suite('FSHandler - Existência', () => {
        T.assert(typeof FSHandler !== 'undefined', 'FSHandler existe');
        T.assertType(FSHandler.isSupported, 'function', 'isSupported');
        T.assertType(FSHandler.openDirectory, 'function', 'openDirectory');
        T.assertType(FSHandler.readDirectory, 'function', 'readDirectory');
        T.assertType(FSHandler.saveFile, 'function', 'saveFile');
        T.assertType(FSHandler.getFileHandle, 'function', 'getFileHandle');
        T.assertType(FSHandler.createNewFile, 'function', 'createNewFile');
        T.assertType(FSHandler.deleteFile, 'function', 'deleteFile');
    });

    T.suite('FSHandler - Suporte do Browser', () => {
        const supported = FSHandler.isSupported();
        T.assertType(supported, 'boolean', 'isSupported retorna boolean');

        if (supported) {
            T.pass('File System Access API suportada');
            T.assertExists(window.showDirectoryPicker, 'showDirectoryPicker');
            T.assertExists(window.showOpenFilePicker, 'showOpenFilePicker');
        } else {
            T.fail('File System Access API NÃO suportada');
        }
    });

    T.suite('FSHandler - Handles Registry', () => {
        T.assertExists(FSHandler.handles, 'handles object existe');
        T.assertType(FSHandler.handles, 'object', 'handles é object');

        const handleCount = Object.keys(FSHandler.handles).length;
        T.pass(`${handleCount} handles registrados`);
    });

    T.suite('FSHandler - addWorkspaceFromFolder', () => {
        T.assertType(window.addWorkspaceFromFolder, 'function', 'addWorkspaceFromFolder existe');
    });

    T.suite('FSHandler - Arquivos com Handle', () => {
        // Verificar se existem arquivos com handles vinculados
        let totalWithHandle = 0;
        let totalWithoutHandle = 0;

        for (const wsId in window.workspaceFiles) {
            const files = window.workspaceFiles[wsId];
            if (Array.isArray(files)) {
                files.forEach(f => {
                    if (f.handle) {
                        totalWithHandle++;
                    } else if (f.source === 'filesystem') {
                        totalWithoutHandle++;
                    }
                });
            }
        }

        T.pass(`${totalWithHandle} arquivos com handle ativo`);
        if (totalWithoutHandle > 0) {
            T.fail(`${totalWithoutHandle} arquivos do sistema sem handle (reconectar)`);
        }
    });
});
