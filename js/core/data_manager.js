/**
 * Cromva Data Manager
 * Exportação, importação, backup e restore de dados
 */

const CromvaData = {
    /**
     * Exporta todos os dados para JSON
     */
    exportAll() {
        const data = {
            version: CromvaConfig?.VERSION || '1.0.0',
            exportedAt: new Date().toISOString(),
            notes: window.notes || [],
            workspaces: window.workspaces || [],
            workspaceFiles: window.workspaceFiles || {},
            settings: JSON.parse(localStorage.getItem('cromva-settings') || '{}'),
            canvasState: JSON.parse(localStorage.getItem('cromva-canvasState') || '{}')
        };

        return data;
    },

    /**
     * Exporta e faz download como arquivo JSON
     */
    downloadExport(filename = null) {
        const data = this.exportAll();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const name = filename || `cromva-backup-${Date.now()}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Backup exportado com sucesso!');
        console.log('[CromvaData] Exported:', name);

        return name;
    },

    /**
     * Importa dados de um arquivo JSON
     * @param {File} file - Arquivo a importar
     * @param {Object} options - { merge: boolean, confirmOverwrite: boolean }
     */
    async importFromFile(file, options = {}) {
        const { merge = false, confirmOverwrite = true } = options;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Validar estrutura
            if (!data.notes || !data.workspaces) {
                throw new Error('Arquivo inválido: estrutura incorreta');
            }

            // Confirmar se vai sobrescrever
            if (confirmOverwrite && !merge) {
                const ok = await ConfirmModal.show({
                    title: 'Importar Dados',
                    message: `Isso irá substituir ${window.notes.length} notas e ${window.workspaces.length} workspaces pelos dados do arquivo. Deseja continuar?`,
                    confirmText: 'Importar',
                    type: 'warning'
                });

                if (!ok) {
                    showToast('Importação cancelada');
                    return false;
                }
            }

            // Backup antes de importar
            this.createBackup();

            if (merge) {
                // Merge: adicionar sem duplicar IDs
                const existingIds = new Set(window.notes.map(n => n.id));
                const newNotes = data.notes.filter(n => !existingIds.has(n.id));
                window.notes.push(...newNotes);

                const existingWsIds = new Set(window.workspaces.map(w => w.id));
                const newWs = data.workspaces.filter(w => !existingWsIds.has(w.id));
                window.workspaces.push(...newWs);

                // Merge workspaceFiles
                Object.assign(window.workspaceFiles, data.workspaceFiles);

                showToast(`Importado: +${newNotes.length} notas, +${newWs.length} workspaces`);
            } else {
                // Substituir tudo
                window.notes = data.notes;
                window.workspaces = data.workspaces;
                window.workspaceFiles = data.workspaceFiles || {};

                // Restaurar settings se existir
                if (data.settings) {
                    localStorage.setItem('cromva-settings', JSON.stringify(data.settings));
                }

                showToast(`Importado: ${data.notes.length} notas, ${data.workspaces.length} workspaces`);
            }

            // Salvar e re-renderizar
            saveData();
            renderNotes();

            console.log('[CromvaData] Imported successfully');
            return true;

        } catch (e) {
            console.error('[CromvaData] Import error:', e);
            showToast('Erro ao importar: ' + e.message);
            return false;
        }
    },

    /**
     * Abre dialog para selecionar arquivo e importar
     */
    async promptImport(merge = false) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        return new Promise((resolve) => {
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const result = await this.importFromFile(file, { merge });
                    resolve(result);
                } else {
                    resolve(false);
                }
            };
            input.click();
        });
    },

    /**
     * Cria backup no localStorage
     */
    createBackup() {
        const data = this.exportAll();
        const key = `cromva-backup-${Date.now()}`;

        try {
            localStorage.setItem(key, JSON.stringify(data));
            console.log('[CromvaData] Backup created:', key);

            // Limitar a 5 backups
            this.cleanOldBackups(5);

            return key;
        } catch (e) {
            console.error('[CromvaData] Backup failed:', e);
            return null;
        }
    },

    /**
     * Lista backups disponíveis
     */
    listBackups() {
        const backups = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('cromva-backup-')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    backups.push({
                        key,
                        date: new Date(parseInt(key.split('-')[2])),
                        notesCount: data.notes?.length || 0,
                        size: localStorage.getItem(key).length
                    });
                } catch (e) {
                    // Ignorar backups corrompidos
                }
            }
        }
        return backups.sort((a, b) => b.date - a.date);
    },

    /**
     * Restaura um backup
     */
    async restoreBackup(key) {
        try {
            const data = JSON.parse(localStorage.getItem(key));
            if (!data || !data.notes) {
                throw new Error('Backup inválido');
            }

            const ok = await ConfirmModal.show({
                title: 'Restaurar Backup',
                message: `Restaurar backup de ${new Date(data.exportedAt).toLocaleString()}? Seus dados atuais serão substituídos.`,
                confirmText: 'Restaurar',
                type: 'warning'
            });

            if (!ok) return false;

            window.notes = data.notes;
            window.workspaces = data.workspaces;
            window.workspaceFiles = data.workspaceFiles || {};

            saveData();
            renderNotes();

            showToast('Backup restaurado com sucesso!');
            return true;

        } catch (e) {
            console.error('[CromvaData] Restore failed:', e);
            showToast('Erro ao restaurar backup');
            return false;
        }
    },

    /**
     * Remove backups antigos, mantendo os N mais recentes
     */
    cleanOldBackups(keep = 5) {
        const backups = this.listBackups();
        if (backups.length > keep) {
            const toRemove = backups.slice(keep);
            toRemove.forEach(b => {
                localStorage.removeItem(b.key);
                console.log('[CromvaData] Removed old backup:', b.key);
            });
        }
    },

    /**
     * Calcula estatísticas dos dados
     */
    getStats() {
        const notes = window.notes || [];
        const workspaces = window.workspaces || [];
        const files = Object.values(window.workspaceFiles || {}).flat();

        let totalContentSize = 0;
        notes.forEach(n => {
            totalContentSize += (n.content || '').length;
        });

        return {
            notesCount: notes.length,
            workspacesCount: workspaces.length,
            filesCount: files.length,
            totalContentSize: totalContentSize,
            formattedSize: this.formatSize(totalContentSize),
            avgNoteSize: notes.length ? Math.round(totalContentSize / notes.length) : 0,
            backupsCount: this.listBackups().length
        };
    },

    /**
     * Formata tamanho em bytes
     */
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
};

// Export global
window.CromvaData = CromvaData;
