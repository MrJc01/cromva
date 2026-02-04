
class SpotlightManager {
    static isOpen = false;
    static selectedIndex = 0;
    static results = [];

    static init() {
        const overlay = document.getElementById('spotlight-overlay');
        const input = document.getElementById('spotlight-input');

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close();
        });

        // Key Events
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
            if (this.isOpen) this.handleNavigation(e);
        });

        // Input Event
        input.addEventListener('input', (e) => this.handleInput(e.target.value));
    }

    static toggle() {
        this.isOpen ? this.close() : this.open();
    }

    static open() {
        this.isOpen = true;
        const overlay = document.getElementById('spotlight-overlay');
        const input = document.getElementById('spotlight-input');
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        input.focus();
        input.value = '';
        this.renderResults([]); // Clear previous
    }

    static close() {
        this.isOpen = false;
        const overlay = document.getElementById('spotlight-overlay');
        overlay.classList.add('hidden');
        overlay.classList.remove('flex');
    }

    static async handleInput(query) {
        if (!query) {
            this.renderResults([]);
            return;
        }

        const results = await this.aggregateResults(query);
        this.results = results;
        this.selectedIndex = 0;
        this.renderResults(results);
    }

    static async aggregateResults(query) {
        let results = [];
        const qLower = query.toLowerCase();
        const settings = window.cromvaSettings?.providers || { math: true, file: true, wiki: true, convert: true, time: true, weather: true, synonym: true };

        // 1. Math Provider
        try {
            if (settings.math && /^[\d\s\+\-\*\/\(\)\.]+$/.test(query) && /\d/.test(query)) {
                const result = Function('"use strict";return (' + query + ')')();
                if (result !== undefined && !isNaN(result)) {
                    results.push({
                        type: 'math', icon: 'calculator', color: 'blue',
                        title: `${query} = ${result}`, desc: 'Calculadora Inline',
                        action: () => { navigator.clipboard.writeText(result); showToast('Resultado copiado!'); this.close(); }
                    });
                }
            }
        } catch (e) { }

        // 2. Unit Conversion Provider
        if (settings.convert && qLower.includes(' to ')) {
            const parts = qLower.split(' to ');
            if (parts[0].includes('usd') && parts[1].includes('brl')) {
                const amount = parseFloat(parts[0]) || 1;
                const rate = 5.80;
                results.push({
                    type: 'convert', icon: 'arrow-right-left', color: 'amber',
                    title: `${amount} USD = ${(amount * rate).toFixed(2)} BRL`, desc: 'Conversão de Moeda (Estimada)',
                    action: () => { showToast('Taxa usada: 5.80'); this.close(); }
                });
            }
            if (parts[0].includes('kg') && parts[1].includes('lbs')) {
                const amount = parseFloat(parts[0]) || 1;
                results.push({
                    type: 'convert', icon: 'scale', color: 'amber',
                    title: `${amount} kg = ${(amount * 2.20462).toFixed(2)} lbs`, desc: 'Conversão de Massa',
                    action: () => { this.close(); }
                });
            }
        }

        // 3. Time Provider
        if (settings.time && (qLower.startsWith('time ') || qLower.startsWith('hora '))) {
            const city = qLower.replace(/time |hora /, '');
            let timeZone = null;
            if (city.includes('tokyo') || city.includes('toquio')) timeZone = 'Asia/Tokyo';
            if (city.includes('london') || city.includes('londres')) timeZone = 'Europe/London';
            if (city.includes('ny') || city.includes('york')) timeZone = 'America/New_York';

            if (timeZone) {
                const time = new Date().toLocaleTimeString('pt-BR', { timeZone, hour: '2-digit', minute: '2-digit' });
                results.push({
                    type: 'time', icon: 'clock', color: 'purple',
                    title: `Agora em ${city}: ${time}`, desc: `Fuso Horário: ${timeZone}`,
                    action: () => { this.close(); }
                });
            }
        }

        // 4. Weather Provider (OpenMeteo)
        if (settings.weather && (qLower.startsWith('clima ') || qLower.startsWith('weather '))) {
            const city = qLower.replace(/clima |weather /, '');
            // Mock Cities Lat/Lon for demo
            let lat, lon;
            if (city.includes('london') || city.includes('londres')) { lat = 51.5; lon = -0.11; }
            if (city.includes('ny') || city.includes('york')) { lat = 40.71; lon = -74.00; }
            if (city.includes('sp') || city.includes('paulo')) { lat = -23.55; lon = -46.63; }

            if (lat) {
                results.push({
                    type: 'weather', icon: 'cloud', color: 'cyan',
                    title: `Clima em ${city}`, desc: 'Clique para ver a temperatura atual',
                    action: async () => {
                        try {
                            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                            const data = await res.json();
                            showToast(`Temperatura: ${data.current_weather.temperature}°C`);
                            this.close();
                        } catch (e) { showToast("Erro ao buscar clima"); }
                    }
                });
            }
        }

        // 5. Synonyms Provider (Datamuse)
        if (settings.synonym && (qLower.startsWith('syn ') || qLower.startsWith('sinonimo '))) {
            const word = qLower.replace(/syn |sinonimo /, '');
            results.push({
                type: 'syn', icon: 'type', color: 'indigo',
                title: `Sinônimos de "${word}"`, desc: 'Buscar sinônimos (Inglês)',
                action: async () => {
                    try {
                        const res = await fetch(`https://api.datamuse.com/words?rel_syn=${word}&max=5`);
                        const data = await res.json();
                        const syns = data.map(d => d.word).join(', ');
                        if (syns) alert(`Sinônimos: ${syns}`);
                        else showToast("Nenhum encontrado");
                        this.close();
                    } catch (e) { showToast("Erro API Datamuse"); }
                }
            });
        }

        // 6. Files Provider (Fuzzy)
        if (settings.file) {
            const allFiles = this.getAllFiles();
            const fileMatches = allFiles.filter(f => f.name.toLowerCase().includes(qLower));
            fileMatches.forEach(f => {
                results.push({
                    type: 'file', icon: f.type === 'folder' ? 'folder' : 'file', color: f.type === 'folder' ? 'emerald' : 'zinc',
                    title: f.name, desc: `${f.type.toUpperCase()} • Workspace ${f.wsId}`,
                    action: () => { showToast(`Abrindo ${f.name}...`); this.close(); }
                });
            });
        }

        // 7. Wiki Dictionary (Custom Modal)
        if (settings.wiki && (qLower.startsWith('def ') || qLower.startsWith('define ') || (query.length > 3 && results.length < 3))) {
            const term = qLower.replace(/def |define /, '');
            results.push({
                type: 'wiki', icon: 'book', color: 'pink',
                title: `Definir "${term}"`, desc: 'Wikipédia',
                action: async () => {
                    try {
                        showToast('Buscando na Wikipédia...');
                        const url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`;
                        const res = await fetch(url);
                        const data = await res.json();

                        if (data.title) {
                            // Show Wiki Modal
                            const modal = document.getElementById('wiki-modal');
                            document.getElementById('wiki-title').innerText = data.title;
                            document.getElementById('wiki-link').href = data.content_urls.desktop.page;

                            let html = `<p class="text-sm font-medium mb-4">${data.description || 'Sem descrição'}</p>`;
                            if (data.thumbnail) {
                                html += `<img src="${data.thumbnail.source}" class="w-full h-48 object-cover rounded-lg mb-4 border border-zinc-700">`;
                            }
                            html += `<p>${data.extract_html || data.extract}</p>`;

                            document.getElementById('wiki-content').innerHTML = html;
                            modal.classList.remove('hidden');
                            modal.classList.add('flex');
                        } else {
                            showToast('Definição não encontrada.');
                        }
                    } catch (e) { showToast('Erro ao conectar com Wikipédia.'); }
                    this.close();
                }
            });
        }

        // 8. Custom Search Engines
        if (window.cromvaSettings?.customEngines) {
            window.cromvaSettings.customEngines.forEach(eng => {
                results.push({
                    type: 'search', icon: 'globe', color: 'zinc',
                    title: `Buscar no ${eng.name}`, desc: `Pesquisar por "${query}"`,
                    action: () => {
                        const finalUrl = eng.url.replace('{text}', encodeURIComponent(query));
                        window.open(finalUrl, '_blank');
                        this.close();
                    }
                });
            });
        }

        return results;
    }

    static getAllFiles() {
        // Needs to access workspaceFiles from main.js. 
        // NOTE: Since modules are not used, window global is shared if loaded sequentially.
        // We will assume 'workspaceFiles' is on window or global scope.
        // If not, we need to bind it.
        let gathered = [];
        if (typeof workspaceFiles !== 'undefined') {
            Object.entries(workspaceFiles).forEach(([wsId, files]) => {
                files.forEach(f => gathered.push({ ...f, wsId }));
            });
        }
        return gathered;
    }

    static renderResults(results) {
        const container = document.getElementById('spotlight-results');
        container.innerHTML = '';

        if (results.length === 0) {
            container.innerHTML = `
                <div class="py-8 text-center text-zinc-500 flex flex-col items-center gap-2 opacity-60">
                    <i data-lucide="search-x" class="w-6 h-6 opacity-30"></i>
                    <p class="text-xs">Nenhum resultado encontrado</p>
                </div>`;
            lucide.createIcons();
            return;
        }

        results.forEach((res, index) => {
            const el = document.createElement('div');
            const isSelected = index === this.selectedIndex;
            el.className = `flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`;
            el.onclick = () => res.action();
            el.innerHTML = `
                <div class="w-8 h-8 rounded flex items-center justify-center bg-${res.color}-500/10 text-${res.color}-500">
                    <i data-lucide="${res.icon}" class="w-4 h-4"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-medium text-zinc-200 truncate">${res.title}</h4>
                    <p class="text-[10px] text-zinc-500 truncate">${res.desc}</p>
                </div>
                ${isSelected ? '<i data-lucide="corner-down-left" class="w-3 h-3 text-zinc-500"></i>' : ''}
            `;
            container.appendChild(el);
        });
        lucide.createIcons();
    }

    static handleNavigation(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex + 1) % this.results.length;
            this.renderResults(this.results);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = (this.selectedIndex - 1 + this.results.length) % this.results.length;
            this.renderResults(this.results);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.results[this.selectedIndex]) {
                this.results[this.selectedIndex].action();
            }
        }
    }
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    SpotlightManager.init();
    // Expose Global
    window.SpotlightManager = SpotlightManager;
});
