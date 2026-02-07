/**
 * Cromva Session Recorder
 * Gravação de sessão para replay
 */

const SessionRecorder = {
    // Estado
    isRecording: false,
    events: [],
    startTime: null,
    maxEvents: 5000,

    /**
     * Inicia gravação
     */
    start() {
        if (this.isRecording) return;

        this.isRecording = true;
        this.events = [];
        this.startTime = Date.now();

        // Capturar cliques
        document.addEventListener('click', this._handleClick);

        // Capturar teclas
        document.addEventListener('keydown', this._handleKeydown);

        // Capturar scroll
        document.addEventListener('scroll', this._handleScroll, true);

        // Capturar mudanças de input
        document.addEventListener('input', this._handleInput);

        // Capturar navegação
        window.addEventListener('popstate', this._handleNavigation);

        console.log('[SessionRecorder] Recording started');

        if (typeof showToast !== 'undefined') {
            showToast('🔴 Gravação iniciada', 'info');
        }
    },

    /**
     * Para gravação
     */
    stop() {
        if (!this.isRecording) return;

        this.isRecording = false;

        document.removeEventListener('click', this._handleClick);
        document.removeEventListener('keydown', this._handleKeydown);
        document.removeEventListener('scroll', this._handleScroll, true);
        document.removeEventListener('input', this._handleInput);
        window.removeEventListener('popstate', this._handleNavigation);

        console.log('[SessionRecorder] Recording stopped:', this.events.length, 'events');

        if (typeof showToast !== 'undefined') {
            showToast(`⏹️ Gravação parada: ${this.events.length} eventos`, 'success');
        }

        return this.getRecording();
    },

    /**
     * Handler de clique
     */
    _handleClick: function (e) {
        SessionRecorder._addEvent('click', {
            x: e.clientX,
            y: e.clientY,
            target: SessionRecorder._getSelector(e.target),
            button: e.button
        });
    },

    /**
     * Handler de tecla
     */
    _handleKeydown: function (e) {
        SessionRecorder._addEvent('keydown', {
            key: e.key,
            code: e.code,
            ctrl: e.ctrlKey,
            alt: e.altKey,
            shift: e.shiftKey,
            meta: e.metaKey,
            target: SessionRecorder._getSelector(e.target)
        });
    },

    /**
     * Handler de scroll
     */
    _handleScroll: function (e) {
        // Debounce scroll events
        clearTimeout(SessionRecorder._scrollTimer);
        SessionRecorder._scrollTimer = setTimeout(() => {
            SessionRecorder._addEvent('scroll', {
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                target: SessionRecorder._getSelector(e.target)
            });
        }, 100);
    },

    /**
     * Handler de input
     */
    _handleInput: function (e) {
        SessionRecorder._addEvent('input', {
            target: SessionRecorder._getSelector(e.target),
            length: e.target.value?.length || 0
        });
    },

    /**
     * Handler de navegação
     */
    _handleNavigation: function () {
        SessionRecorder._addEvent('navigation', {
            url: window.location.href
        });
    },

    /**
     * Adiciona evento
     */
    _addEvent(type, data) {
        if (!this.isRecording) return;
        if (this.events.length >= this.maxEvents) return;

        this.events.push({
            type,
            time: Date.now() - this.startTime,
            data
        });
    },

    /**
     * Obtém seletor CSS do elemento
     */
    _getSelector(el) {
        if (!el || el === document) return 'document';
        if (el === window) return 'window';

        if (el.id) return `#${el.id}`;

        let selector = el.tagName?.toLowerCase() || '';
        if (el.className && typeof el.className === 'string') {
            const classes = el.className.split(' ').filter(c => c).slice(0, 2);
            if (classes.length) {
                selector += '.' + classes.join('.');
            }
        }

        return selector || 'unknown';
    },

    /**
     * Retorna gravação
     */
    getRecording() {
        return {
            version: '1.0',
            startTime: new Date(this.startTime).toISOString(),
            duration: Date.now() - this.startTime,
            eventCount: this.events.length,
            url: window.location.href,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            events: this.events
        };
    },

    /**
     * Exporta gravação
     */
    export() {
        const recording = this.getRecording();
        const json = JSON.stringify(recording, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `session-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    },

    /**
     * Replay simples (visual)
     */
    async replay(recording, speed = 1) {
        if (!recording || !recording.events) return;

        // Criar cursor virtual
        const cursor = document.createElement('div');
        cursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: rgba(255, 0, 0, 0.5);
            border-radius: 50%;
            pointer-events: none;
            z-index: 99999;
            transition: all 0.1s ease;
        `;
        document.body.appendChild(cursor);

        for (const event of recording.events) {
            await this._sleep(event.time / speed);

            if (event.type === 'click') {
                cursor.style.left = `${event.data.x - 10}px`;
                cursor.style.top = `${event.data.y - 10}px`;
                cursor.style.transform = 'scale(1.5)';
                setTimeout(() => cursor.style.transform = 'scale(1)', 100);
            }
        }

        cursor.remove();
    },

    /**
     * Sleep helper
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Limpa gravação
     */
    clear() {
        this.events = [];
        this.startTime = null;
    }
};

// Export global
window.SessionRecorder = SessionRecorder;
