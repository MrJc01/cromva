/**
 * CROMVA MOCK DATA
 * Dados de teste para desenvolvimento
 */

const CromvaMock = {
    // Notas de exemplo
    notes: [
        {
            id: 100001,
            title: 'Nota de Teste 1',
            content: '# Título\n\nConteúdo da nota de teste 1.\n\n- Item 1\n- Item 2\n- Item 3',
            category: 'Sistema',
            date: '2026-02-05T10:00:00.000Z'
        },
        {
            id: 100002,
            title: 'Nota de Teste 2',
            content: '## Subtítulo\n\nConteúdo **negrito** e *itálico*.',
            category: 'Trabalho',
            date: '2026-02-05T11:00:00.000Z'
        },
        {
            id: 100003,
            title: 'Nota de Teste 3',
            content: '```javascript\nconsole.log("Hello!");\n```',
            category: 'Design',
            date: '2026-02-05T12:00:00.000Z'
        }
    ],

    // Workspaces de exemplo
    workspaces: [
        {
            id: 200001,
            name: 'Mock Workspace',
            desc: 'Workspace para testes',
            color: 'blue',
            date: '2026-02-05T10:00:00.000Z'
        },
        {
            id: 200002,
            name: 'Mock Local',
            desc: 'Workspace local simulado',
            color: 'green',
            date: '2026-02-05T10:00:00.000Z'
        }
    ],

    // Aplicar mocks (substituir dados)
    apply() {
        console.log('%c🔧 Aplicando dados mock...', 'color: #f59e0b;');
        window.notes = [...this.notes];
        window.workspaces = [...this.workspaces];
        window.workspaceFiles = {
            200001: [],
            200002: []
        };
        renderNotes();
        renderWorkspaces();
        console.log('%c✓ Dados mock aplicados!', 'color: #10b981;');
    },

    // Adicionar mocks (manter dados existentes)
    add() {
        console.log('%c🔧 Adicionando dados mock...', 'color: #f59e0b;');
        window.notes.push(...this.notes);
        window.workspaces.push(...this.workspaces);
        window.workspaceFiles[200001] = [];
        window.workspaceFiles[200002] = [];
        renderNotes();
        renderWorkspaces();
        console.log('%c✓ Dados mock adicionados!', 'color: #10b981;');
    },

    // Limpar mocks
    clear() {
        console.log('%c🧹 Removendo dados mock...', 'color: #6b7280;');
        window.notes = window.notes.filter(n => n.id < 100000 || n.id > 100999);
        window.workspaces = window.workspaces.filter(w => w.id < 200000 || w.id > 200999);
        delete window.workspaceFiles[200001];
        delete window.workspaceFiles[200002];
        renderNotes();
        renderWorkspaces();
        console.log('%c✓ Dados mock removidos!', 'color: #10b981;');
    },

    // Gerar muitas notas para stress test
    generateMany(count = 100) {
        console.log(`%c🔧 Gerando ${count} notas...`, 'color: #f59e0b;');
        const categories = ['Sistema', 'Trabalho', 'Design'];
        for (let i = 0; i < count; i++) {
            window.notes.push({
                id: 300000 + i,
                title: `Nota Gerada ${i + 1}`,
                content: `# Nota ${i + 1}\n\nConteúdo gerado automaticamente para stress test.\n\n${'Lorem ipsum dolor sit amet. '.repeat(10)}`,
                category: categories[i % 3],
                date: new Date().toISOString()
            });
        }
        renderNotes();
        console.log(`%c✓ ${count} notas geradas!`, 'color: #10b981;');
    },

    // Limpar notas geradas
    clearGenerated() {
        window.notes = window.notes.filter(n => n.id < 300000 || n.id > 399999);
        renderNotes();
        console.log('%c✓ Notas geradas removidas!', 'color: #10b981;');
    }
};

window.CromvaMock = CromvaMock;
console.log('%c📦 CromvaMock carregado! Use CromvaMock.apply() para testar',
    'font-size: 12px; color: #3b82f6;');
