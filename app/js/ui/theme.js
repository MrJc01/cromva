/**
 * Cromva Theme Manager
 * Sistema de temas customizáveis
 */

const ThemeManager = {
    // Temas disponíveis
    themes: {
        dark: {
            name: 'Dark (Padrão)',
            colors: {
                '--bg-primary': '#0a0a0a',
                '--bg-secondary': '#18181b',
                '--bg-tertiary': '#27272a',
                '--text-primary': '#fafafa',
                '--text-secondary': '#a1a1aa',
                '--text-muted': '#71717a',
                '--border-color': '#3f3f46',
                '--accent': '#10b981',
                '--accent-hover': '#34d399',
                '--danger': '#ef4444',
                '--warning': '#f59e0b'
            }
        },
        midnight: {
            name: 'Midnight Blue',
            colors: {
                '--bg-primary': '#0f172a',
                '--bg-secondary': '#1e293b',
                '--bg-tertiary': '#334155',
                '--text-primary': '#f8fafc',
                '--text-secondary': '#94a3b8',
                '--text-muted': '#64748b',
                '--border-color': '#475569',
                '--accent': '#3b82f6',
                '--accent-hover': '#60a5fa',
                '--danger': '#f43f5e',
                '--warning': '#fbbf24'
            }
        },
        forest: {
            name: 'Forest',
            colors: {
                '--bg-primary': '#052e16',
                '--bg-secondary': '#14532d',
                '--bg-tertiary': '#166534',
                '--text-primary': '#f0fdf4',
                '--text-secondary': '#86efac',
                '--text-muted': '#4ade80',
                '--border-color': '#22c55e',
                '--accent': '#84cc16',
                '--accent-hover': '#a3e635',
                '--danger': '#dc2626',
                '--warning': '#eab308'
            }
        },
        light: {
            name: 'Light',
            colors: {
                '--bg-primary': '#ffffff',
                '--bg-secondary': '#f4f4f5',
                '--bg-tertiary': '#e4e4e7',
                '--text-primary': '#18181b',
                '--text-secondary': '#52525b',
                '--text-muted': '#71717a',
                '--border-color': '#d4d4d8',
                '--accent': '#059669',
                '--accent-hover': '#10b981',
                '--danger': '#dc2626',
                '--warning': '#d97706'
            }
        },
        highContrast: {
            name: 'Alto Contraste',
            colors: {
                '--bg-primary': '#000000',
                '--bg-secondary': '#1a1a1a',
                '--bg-tertiary': '#333333',
                '--text-primary': '#ffffff',
                '--text-secondary': '#e0e0e0',
                '--text-muted': '#b0b0b0',
                '--border-color': '#ffffff',
                '--accent': '#00ff00',
                '--accent-hover': '#66ff66',
                '--danger': '#ff0000',
                '--warning': '#ffff00'
            }
        }
    },

    currentTheme: 'dark',
    wallpaper: {
        url: '',
        opacity: 0.5,
        blur: 10
    },
    animationsEnabled: true,

    /**
     * Inicializa o theme manager
     */
    init() {
        // Carregar tema salvo
        const saved = localStorage.getItem('cromva-theme');
        if (saved && this.themes[saved]) {
            this.apply(saved);
        }

        // Carregar wallpaper salvo
        const savedWallpaper = localStorage.getItem('cromva-wallpaper');
        if (savedWallpaper) {
            try {
                this.wallpaper = JSON.parse(savedWallpaper);
                this.setWallpaper(this.wallpaper);
            } catch (e) {
                console.error('Erro ao carregar wallpaper:', e);
            }
        }

        // Carregar animações
        const savedAnim = localStorage.getItem('cromva-animations');
        if (savedAnim !== null) {
            this.toggleAnimations(savedAnim === 'true');
        } else {
            this.toggleAnimations(true); // Default on
        }

        // Adicionar CSS variables base se não existir
        this.ensureBaseStyles();

        console.log('[ThemeManager] Initialized with theme:', this.currentTheme);
    },

    setWallpaper(config) {
        console.log('[ThemeManager] setWallpaper called with:', config ? Object.keys(config) : 'null');
        this.wallpaper = { ...this.wallpaper, ...config };

        const root = document.documentElement;
        if (this.wallpaper.url) {
            console.log('[ThemeManager] Applying wallpaper URL (length):', this.wallpaper.url.length);
            root.style.setProperty('--bg-image', `url('${this.wallpaper.url}')`);
            root.style.setProperty('--bg-opacity', this.wallpaper.opacity);
            root.style.setProperty('--bg-blur', `${this.wallpaper.blur}px`);
            document.body.classList.add('has-wallpaper');

            // Ensure body background doesn't cover wallpaper
            document.body.style.backgroundColor = 'transparent';
        } else {
            root.style.removeProperty('--bg-image');
            document.body.classList.remove('has-wallpaper');
            // Restore theme background
            document.body.style.removeProperty('background-color');
        }

        localStorage.setItem('cromva-wallpaper', JSON.stringify(this.wallpaper));
    },

    toggleAnimations(enabled) {
        this.animationsEnabled = enabled;
        if (enabled) {
            document.body.classList.remove('no-animations');
        } else {
            document.body.classList.add('no-animations');
        }
        localStorage.setItem('cromva-animations', enabled);
    },

    /**
     * Aplica um tema
     * @param {string} themeName - Nome do tema
     */
    apply(themeName) {
        const theme = this.themes[themeName];
        if (!theme) {
            console.warn('[ThemeManager] Theme not found:', themeName);
            return false;
        }

        const root = document.documentElement;

        // Aplicar todas as CSS variables
        for (const [prop, value] of Object.entries(theme.colors)) {
            root.style.setProperty(prop, value);
        }

        // Salvar preferência
        this.currentTheme = themeName;
        localStorage.setItem('cromva-theme', themeName);

        // Emitir evento
        if (typeof CromvaEvents !== 'undefined') {
            CromvaEvents.emit('theme:changed', { theme: themeName });
        }

        console.log('[ThemeManager] Applied theme:', themeName);
        return true;
    },

    /**
     * Lista temas disponíveis
     */
    list() {
        return Object.entries(this.themes).map(([id, theme]) => ({
            id,
            name: theme.name,
            isCurrent: this.currentTheme === id
        }));
    },

    /**
     * Cria seletor de temas
     */
    createSelector(containerId) {
        const container = typeof containerId === 'string'
            ? document.getElementById(containerId)
            : containerId;

        if (!container) return;

        let html = '<div class="space-y-2">';

        for (const [id, theme] of Object.entries(this.themes)) {
            const isActive = this.currentTheme === id;
            const activeClass = isActive ? 'ring-2 ring-emerald-500' : '';
            const colors = Object.values(theme.colors).slice(0, 4);

            html += `
                <button class="w-full flex items-center gap-3 p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors ${activeClass}"
                        data-theme="${id}">
                    <div class="flex gap-1">
                        ${colors.map(c => `<div class="w-4 h-4 rounded-full" style="background:${c}"></div>`).join('')}
                    </div>
                    <span class="text-sm text-zinc-200">${theme.name}</span>
                    ${isActive ? '<span class="ml-auto text-emerald-400 text-xs">Ativo</span>' : ''}
                </button>
            `;
        }

        html += '</div>';
        container.innerHTML = html;

        // Event listeners
        container.querySelectorAll('[data-theme]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.apply(btn.dataset.theme);
                this.createSelector(container); // Re-render
            });
        });
    },

    /**
     * Adiciona estilos base se não existirem
     */
    ensureBaseStyles() {
        if (document.getElementById('theme-base-styles')) return;

        const style = document.createElement('style');
        style.id = 'theme-base-styles';
        style.textContent = `
            :root {
                --bg-primary: #0a0a0a;
                --bg-secondary: #18181b;
                --bg-tertiary: #27272a;
                --text-primary: #fafafa;
                --text-secondary: #a1a1aa;
                --text-muted: #71717a;
                --border-color: #3f3f46;
                --accent: #10b981;
                --accent-hover: #34d399;
                --danger: #ef4444;
                --warning: #f59e0b;
            }
        `;
        document.head.insertBefore(style, document.head.firstChild);
    },

    /**
     * Cria tema customizado
     */
    createCustom(name, colors) {
        const id = 'custom-' + Date.now();
        this.themes[id] = { name, colors };

        // Salvar temas customizados
        this.saveCustomThemes();

        return id;
    },

    /**
     * Salva temas customizados no localStorage
     */
    saveCustomThemes() {
        const custom = {};
        for (const [id, theme] of Object.entries(this.themes)) {
            if (id.startsWith('custom-')) {
                custom[id] = theme;
            }
        }
        localStorage.setItem('cromva-custom-themes', JSON.stringify(custom));
    },

    /**
     * Carrega temas customizados do localStorage
     */
    loadCustomThemes() {
        try {
            const saved = localStorage.getItem('cromva-custom-themes');
            if (saved) {
                const custom = JSON.parse(saved);
                Object.assign(this.themes, custom);
            }
        } catch (e) {
            console.error('[ThemeManager] Error loading custom themes:', e);
        }
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
    ThemeManager.init();
}

// Export global
window.ThemeManager = ThemeManager;
