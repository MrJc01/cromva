// --- DATA PERSISTENCE & GLOBAL STATE ---
window.notes = [];
window.workspaces = [];
window.workspaceFiles = {};
window.currentWorkspaceId = null;
window.isSidebarHidden = false;
window.currentView = 'home';
window.currentNoteId = null;
window.isFullscreen = false;

function saveData() {
    const data = {
        notes: window.notes,
        workspaces: window.workspaces,
        workspaceFiles: window.workspaceFiles
    };
    console.log('[State] Saving data to localStorage...', data.workspaces.length, 'workspaces');
    localStorage.setItem('cromvaData', JSON.stringify(data));
}

function loadData() {
    const raw = localStorage.getItem('cromvaData');
    if (raw) {
        try {
            const data = JSON.parse(raw);
            window.notes = data.notes || [];
            window.workspaces = data.workspaces || [];
            window.workspaceFiles = data.workspaceFiles || {};
            console.log('[State] Data loaded from localStorage');
        } catch (e) {
            console.error('[State] Failed to load data', e);
            initDefaultData();
        }
    } else {
        initDefaultData();
    }

    // Ensure currentWorkspaceId is valid
    if (window.workspaces.length > 0) {
        // Default to first workspace if currentWorkspaceId is invalid
        const current = window.workspaces.find(ws => ws.id === window.currentWorkspaceId);
        if (!current) {
            window.currentWorkspaceId = window.workspaces[0].id;
        }
    }
}

function initDefaultData() {
    console.log('[State] Initializing default data...');
    // Default Welcome Note
    window.notes = [
        {
            id: 1,
            title: 'Bem-vindo ao Cromva',
            content: '# Cromva OS\n\nEste é o seu novo sistema operacional de produtividade.\n\n- [x] Dados salvos localmente\n- [ ] Sincronização em nuvem (Em breve)\n\nCrie novas notas, workspaces ou abra pastas locais!',
            category: 'Sistema',
            date: new Date().toISOString()
        }
    ];

    // Default Workspace
    window.workspaces = [
        { id: 1, name: 'Principal', desc: 'Workspace padrão', color: 'blue', date: new Date().toISOString() }
    ];

    window.workspaceFiles = {
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
