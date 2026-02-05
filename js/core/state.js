// --- DATA PERSISTENCE ---

let notes = [];
let workspaces = [];
let workspaceFiles = {};

// --- GLOBAL STATE ---
let currentWorkspaceId = null;
let isSidebarHidden = false;
let currentView = 'home';
let currentNoteId = null;
let isFullscreen = false;

function saveData() {
    const data = {
        notes,
        workspaces,
        workspaceFiles
    };
    localStorage.setItem('cromvaData', JSON.stringify(data));
}

function loadData() {
    const raw = localStorage.getItem('cromvaData');
    if (raw) {
        try {
            const data = JSON.parse(raw);
            notes = data.notes || [];
            workspaces = data.workspaces || [];
            workspaceFiles = data.workspaceFiles || {};
        } catch (e) {
            console.error('Failed to load data', e);
            initDefaultData();
        }
    } else {
        initDefaultData();
    }

    // Ensure currentWorkspaceId is valid
    if (workspaces.length > 0) {
        currentWorkspaceId = workspaces[0].id;
    }
}

function initDefaultData() {
    // Default Welcome Note
    notes = [
        {
            id: 1,
            title: 'Bem-vindo ao Cromva',
            content: '# Cromva OS\n\nEste é o seu novo sistema operacional de produtividade.\n\n- [x] Dados salvos localmente\n- [ ] Sincronização em nuvem (Em breve)\n\nCrie novas notas, workspaces ou abra pastas locais!',
            category: 'Sistema',
            date: new Date().toISOString()
        }
    ];

    // Default Workspace
    workspaces = [
        { id: 1, name: 'Principal', desc: 'Workspace padrão', color: 'blue', date: new Date().toISOString() }
    ];

    workspaceFiles = {
        1: []
    };

    saveData();
}

// Initialize on load
loadData();


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
