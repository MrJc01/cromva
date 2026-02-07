/**
 * Cromva Bug Tracker
 * Sistema para rastrear e corrigir bugs existentes
 */

const BugTracker = {
    /**
     * Lista de bugs conhecidos e seu status
     */
    bugs: [
        {
            id: 'BUG-001',
            title: 'Handle perdido após reload',
            description: 'FSHandler perde referência do diretório após recarregar a página',
            status: 'fixed',
            solution: 'Implementado HandleStore com IndexedDB para persistir handles',
            fixedIn: 'js/core/handle_store.js'
        },
        {
            id: 'BUG-002',
            title: 'Duplicação de formatSize',
            description: 'Função formatSize() existia em múltiplos lugares',
            status: 'fixed',
            solution: 'Unificado em js/utils/helpers.js',
            fixedIn: 'js/utils/helpers.js'
        },
        {
            id: 'BUG-003',
            title: 'Funções globais sem namespace',
            description: 'Funções espalhadas no escopo global causando conflitos',
            status: 'fixed',
            solution: 'Criados namespaces: Editor, WorkspaceManager, CromvaState, etc.',
            fixedIn: 'js/core/*.js'
        },
        {
            id: 'BUG-004',
            title: 'Sem tratamento de erros consistente',
            description: 'Erros não tratados causando falhas silenciosas',
            status: 'fixed',
            solution: 'Implementado ErrorHandler com error boundaries e tela de erro amigável',
            fixedIn: 'js/core/error_handler.js'
        },
        {
            id: 'BUG-005',
            title: 'Dados perdidos sem backup',
            description: 'Sem sistema de backup para dados do usuário',
            status: 'fixed',
            solution: 'Implementado sistema de backup automático em CromvaState',
            fixedIn: 'js/core/cromva_state.js'
        },
        {
            id: 'BUG-006',
            title: 'Arquivo sobrescrito sem confirmação',
            description: 'Arquivos podiam ser sobrescritos sem aviso',
            status: 'fixed',
            solution: 'Adicionado backup antes de sobrescrever em FileCache',
            fixedIn: 'js/core/file_cache.js'
        },
        {
            id: 'BUG-007',
            title: 'Operações de arquivo sem retry',
            description: 'Falhas de I/O não tinham retry automático',
            status: 'fixed',
            solution: 'Implementado retry logic com exponential backoff em FileCache',
            fixedIn: 'js/core/file_cache.js'
        },
        {
            id: 'BUG-008',
            title: 'Sem indicador offline',
            description: 'Usuário não sabia quando estava offline',
            status: 'fixed',
            solution: 'Implementado ConnectionStatus e OfflineMode',
            fixedIn: 'js/ui/connection.js, js/core/offline.js'
        }
    ],

    /**
     * Retorna bugs por status
     * @param {string} status - Status do bug (fixed, open, in-progress)
     * @returns {array} Lista de bugs filtrada
     */
    getByStatus(status) {
        return this.bugs.filter(b => b.status === status);
    },

    /**
     * Retorna resumo
     * @returns {object} Resumo dos bugs
     */
    getSummary() {
        const fixed = this.bugs.filter(b => b.status === 'fixed').length;
        const open = this.bugs.filter(b => b.status === 'open').length;
        const inProgress = this.bugs.filter(b => b.status === 'in-progress').length;

        return {
            total: this.bugs.length,
            fixed,
            open,
            inProgress,
            fixRate: `${((fixed / this.bugs.length) * 100).toFixed(0)}%`
        };
    },

    /**
     * Adiciona novo bug
     * @param {object} bug - Dados do bug
     */
    add(bug) {
        const id = `BUG-${String(this.bugs.length + 1).padStart(3, '0')}`;
        this.bugs.push({
            id,
            status: 'open',
            createdAt: new Date().toISOString(),
            ...bug
        });
        return id;
    },

    /**
     * Marca bug como corrigido
     * @param {string} id - ID do bug
     * @param {string} solution - Descrição da solução
     * @param {string} fixedIn - Arquivo onde foi corrigido
     */
    markFixed(id, solution, fixedIn) {
        const bug = this.bugs.find(b => b.id === id);
        if (bug) {
            bug.status = 'fixed';
            bug.solution = solution;
            bug.fixedIn = fixedIn;
            bug.fixedAt = new Date().toISOString();
        }
    },

    /**
     * Exibe relatório no console
     */
    printReport() {
        const summary = this.getSummary();

        console.group('🐛 Bug Tracker Report');
        console.log(`Total: ${summary.total} bugs`);
        console.log(`✅ Corrigidos: ${summary.fixed}`);
        console.log(`🔴 Abertos: ${summary.open}`);
        console.log(`🟡 Em progresso: ${summary.inProgress}`);
        console.log(`Taxa de correção: ${summary.fixRate}`);

        if (summary.open > 0) {
            console.group('Bugs abertos:');
            for (const bug of this.getByStatus('open')) {
                console.log(`${bug.id}: ${bug.title}`);
            }
            console.groupEnd();
        }

        console.groupEnd();
    }
};

// Export global
window.BugTracker = BugTracker;
