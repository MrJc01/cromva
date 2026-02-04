// --- DADOS INICIAIS ---
let notes = [
    { id: 1, title: 'Bem-vindo ao Cromva', content: '# Introdução\nBem-vindo ao **Cromva OS**. Este é um sistema de organização local-first.\n\n## Funcionalidades\n- [x] Editor Markdown Híbrido\n- [x] Grafo de Conexões\n- [ ] Sincronização P2P\n\n> "A simplicidade é o último grau de sofisticação."\n\nExperimente editar esta nota ou criar uma nova usando a barra superior.', category: 'Sistema', date: new Date().toISOString() },
    { id: 2, title: 'Planejamento Q3', content: '### Metas Principais\n1. Refatorar a API de Graph\n2. Melhorar performance do Canvas\n\n`const goal = "ship it";`\n\nVerificar documentação do D3.js para o grafo.', category: 'Trabalho', date: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, title: 'Ideias de Design', content: 'Inspirado no **Linear**, **Obsidian** e **Notion**.\nUtilizar tons de Zinco (Tailwind) para manter a neutralidade visual.\n\n- Zinco 950 para background\n- Zinco 800 para bordas\n- Zinco 100 para texto principal', category: 'Design', date: new Date(Date.now() - 172800000).toISOString() },
    { id: 4, title: 'Novo Algoritmo', content: 'Implementar busca vetorial local usando WebAssembly.', category: 'Sistema', date: new Date(Date.now() - 200000000).toISOString() },
    { id: 5, title: 'Sprint Review', content: 'Preparar slides para a review de sexta-feira.', category: 'Trabalho', date: new Date(Date.now() - 30000000).toISOString() }
];

// --- WORKSPACES DATA ---
const workspaces = [
    { id: 1, name: 'Inicial Padrão', desc: 'Workspace principal do sistema', color: 'blue', date: new Date().toISOString() },
    { id: 2, name: 'Cromva Dev', desc: 'Ambiente de desenvolvimento', color: 'emerald', date: new Date(Date.now() - 100000000).toISOString() }
];

const workspaceFiles = {
    1: [
        { id: 101, name: 'index.html', type: 'file', size: '15 KB', status: 'visible', locked: false },
        { id: 102, name: 'styles.css', type: 'file', size: '4 KB', status: 'visible', locked: false },
        { id: 103, name: 'assets', type: 'folder', size: '-', status: 'visible', locked: false },
        { id: 104, name: 'secret-docs', type: 'folder', size: '-', status: 'visible', locked: true }, // Locked folder
        { id: 105, name: 'legacy', type: 'folder', size: '-', status: 'hidden', locked: false }
    ],
    2: [
        { id: 201, name: 'main.rs', type: 'file', size: '22 KB', status: 'visible', locked: false },
        { id: 202, name: 'Cargo.toml', type: 'file', size: '1 KB', status: 'visible', locked: false }
    ]
};

// --- GLOBAL STATE ---
let currentWorkspaceId = workspaces[0].id;
let isSidebarHidden = false;
let currentView = 'home';
let currentNoteId = null;
let isFullscreen = false;

// --- SETTINGS STATE ---
const defaultSettings = {
    providers: {
        math: true,
        file: true,
        wiki: true,
        convert: true,
        time: true,
        weather: true,
        synonym: true
    },
    customEngines: [
        { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={text}' },
        { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/results?search_query={text}' }
    ]
};

window.cromvaSettings = JSON.parse(localStorage.getItem('cromvaSettings')) || defaultSettings;

function saveSettings() {
    localStorage.setItem('cromvaSettings', JSON.stringify(window.cromvaSettings));
}
