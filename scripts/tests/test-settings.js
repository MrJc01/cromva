/**
 * CROMVA TEST - SETTINGS MODULE
 * Testa configurações
 */

CromvaTest.register('settings', function () {
    const T = CromvaTest;

    T.suite('Settings - Funções Existem', () => {
        T.assertType(window.openSettings, 'function', 'openSettings');
        T.assertType(window.closeSettings, 'function', 'closeSettings');
        T.assertType(window.switchSettingsTab, 'function', 'switchSettingsTab');
        T.assertType(window.triggerBackup, 'function', 'triggerBackup');
        T.assertType(window.saveSettings, 'function', 'saveSettings');
    });

    T.suite('Settings - Elementos DOM', () => {
        T.assertExists(document.getElementById('settings-modal'), '#settings-modal');
        T.assertExists(document.getElementById('settings-general'), '#settings-general');
        T.assertExists(document.getElementById('settings-appearance'), '#settings-appearance');
        T.assertExists(document.getElementById('settings-system'), '#settings-system');
        T.assertExists(document.getElementById('settings-backup'), '#settings-backup');
        T.assertExists(document.getElementById('settings-advanced'), '#settings-advanced');
    });

    T.suite('Settings - cromvaSettings', () => {
        T.assertExists(window.cromvaSettings, 'cromvaSettings existe');
        T.assertExists(window.cromvaSettings.providers, 'providers existe');
        T.assertExists(window.cromvaSettings.customEngines, 'customEngines existe');
    });

    T.suite('Settings - LocalStorage', () => {
        const raw = localStorage.getItem('cromvaSettings');
        if (raw) {
            try {
                JSON.parse(raw);
                T.pass('cromvaSettings válido no localStorage');
            } catch (e) {
                T.fail('cromvaSettings inválido: ' + e.message);
            }
        } else {
            T.pass('cromvaSettings usa defaults (não salvo ainda)');
        }
    });
});
