// --- SETTINGS PANEL ENGINE ---

function openSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('settings-modal').classList.add('flex');
    switchSettingsTab('general');
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
    document.getElementById('settings-modal').classList.remove('flex');
}

function switchSettingsTab(tabId) {
    // 1. Sidebar Buttons State
    document.querySelectorAll('.settings-tab').forEach(btn => {
        btn.classList.remove('bg-zinc-800/50', 'text-zinc-100', 'border', 'border-zinc-700/50');
        btn.classList.add('text-zinc-400');
    });
    const activeBtn = document.getElementById(`tab-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-zinc-800/50', 'text-zinc-100', 'border', 'border-zinc-700/50');
        activeBtn.classList.remove('text-zinc-400');
    }

    // 2. Content Sections State
    document.querySelectorAll('.settings-content').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(`settings-${tabId}`).classList.remove('hidden');

    // 3. Update Header Title
    const titles = {
        'general': 'Geral',
        'appearance': 'Aparência',
        'system': 'Sistema',
        'backup': 'Dados & Backup',
        'search': 'Busca & Inteligência'
    };
    document.getElementById('settings-title').innerText = titles[tabId];

    if (tabId === 'search') renderSearchSettings();
    if (tabId === 'advanced') renderAdvancedSettings();
}

function checkForUpdates() {
    const btn = document.getElementById('btn-update');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Verificando...`;
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
        btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-500"></i> Tudo atualizado`;
        if (window.lucide) lucide.createIcons();
        showToast("Você já tem a versão mais recente");

        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = originalText;
            if (window.lucide) lucide.createIcons();
        }, 3000);
    }, 2000);
}

function triggerBackup() {
    const data = {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        notes: notes,
        workspaces: workspaces,
        files: workspaceFiles
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "cromva_backup_" + Date.now() + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();

    showToast("Backup iniciado...");
}

// --- SEARCH SETTINGS LOGIC ---
function renderSearchSettings() {
    // 1. Providers List
    const pList = document.getElementById('providers-list');
    pList.innerHTML = '';
    const labels = {
        math: 'Calculadora (Math)',
        file: 'Arquivos do Workspace',
        wiki: 'Wikipédia',
        convert: 'Conversor de Unidades',
        time: 'Fuso Horário',
        weather: 'Clima (OpenMeteo)',
        synonym: 'Sinônimos (Datamuse)'
    };

    Object.keys(window.cromvaSettings.providers).forEach(key => {
        const isEnabled = window.cromvaSettings.providers[key];
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between py-2 bg-zinc-900/30 px-3 rounded-lg border border-zinc-800/50';
        item.innerHTML = `
            <span class="text-sm text-zinc-300 font-medium">${labels[key] || key}</span>
            <div onclick="toggleProvider('${key}')" class="w-9 h-5 ${isEnabled ? 'bg-blue-600' : 'bg-zinc-700'} rounded-full relative cursor-pointer transition-colors">
                <div class="absolute top-0.5 ${isEnabled ? 'right-0.5' : 'left-0.5'} w-4 h-4 bg-white rounded-full transition-all"></div>
            </div>
        `;
        pList.appendChild(item);
    });

    // 2. Custom Engines List
    const cList = document.getElementById('custom-engines-list');
    cList.innerHTML = '';
    window.cromvaSettings.customEngines.forEach(eng => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between py-2 bg-zinc-900/30 px-3 rounded-lg border border-zinc-800/50 group';
        item.innerHTML = `
            <div>
                <p class="text-sm font-bold text-zinc-200">${eng.name}</p>
                <p class="text-[10px] text-zinc-500 truncate max-w-[200px]">${eng.url}</p>
            </div>
            <button onclick="removeCustomEngine('${eng.id}')" class="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-all">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
        `;
        cList.appendChild(item);
    });
    if (window.lucide) lucide.createIcons();
}

function toggleProvider(key) {
    window.cromvaSettings.providers[key] = !window.cromvaSettings.providers[key];
    saveSettings();
    renderSearchSettings();
}

function addCustomEngine() {
    const nameInput = document.getElementById('new-engine-name');
    const urlInput = document.getElementById('new-engine-url');
    const name = nameInput.value.trim();
    const url = urlInput.value.trim();

    if (!name || !url) {
        showToast("Preencha nome e URL");
        return;
    }

    if (!url.includes('{text}')) {
        showToast("A URL deve conter {text}");
        return;
    }

    window.cromvaSettings.customEngines.push({
        id: Date.now().toString(),
        name,
        url
    });
    saveSettings();
    renderSearchSettings();

    nameInput.value = '';
    urlInput.value = '';
    showToast("Motor de busca adicionado!");
}

function removeCustomEngine(id) {
    if (confirm('Remover este motor de busca?')) {
        window.cromvaSettings.customEngines = window.cromvaSettings.customEngines.filter(e => e.id !== id);
        saveSettings();
        renderSearchSettings();
        showToast("Motor removido");
    }
}

// --- ADVANCED SETTINGS LOGIC ---
function renderAdvancedSettings() {
    const configTextarea = document.getElementById('system-config-json');
    if (configTextarea) {
        const systemData = {
            notes: notes.length,
            workspaces: workspaces.length,
            settings: window.cromvaSettings,
            version: '1.0.0'
        };
        configTextarea.value = JSON.stringify(systemData, null, 2);
    }
}

function toggleAutoAddFolder() {
    const toggle = document.getElementById('toggle-auto-add');
    if (!toggle) return;

    const knob = toggle.querySelector('div');
    const isEnabled = toggle.classList.contains('bg-blue-600');

    if (isEnabled) {
        toggle.classList.remove('bg-blue-600');
        toggle.classList.add('bg-zinc-700');
        knob.classList.remove('right-0.5');
        knob.classList.add('left-0.5');
        knob.classList.remove('bg-white');
        knob.classList.add('bg-zinc-400');
    } else {
        toggle.classList.remove('bg-zinc-700');
        toggle.classList.add('bg-blue-600');
        knob.classList.remove('left-0.5');
        knob.classList.add('right-0.5');
        knob.classList.remove('bg-zinc-400');
        knob.classList.add('bg-white');
    }

    showToast(isEnabled ? 'Auto-adicionar desativado' : 'Auto-adicionar ativado');
}

function saveSystemConfig() {
    const configTextarea = document.getElementById('system-config-json');
    if (!configTextarea) return;

    try {
        const parsed = JSON.parse(configTextarea.value);
        if (parsed.settings) {
            window.cromvaSettings = parsed.settings;
            saveSettings();
        }
        showToast('Configuração salva! Recarregando...');
        setTimeout(() => location.reload(), 1000);
    } catch (e) {
        showToast('JSON inválido: ' + e.message);
    }
}

