/**
 * Cromva Telemetry (Opt-in)
 * Telemetria anônima para melhorias
 */

const Telemetry = {
    // Estado
    isEnabled: false,
    sessionId: null,
    events: [],

    // Configuração
    config: {
        endpoint: null, // Sem endpoint por padrão
        batchSize: 20,
        flushInterval: 60000 // 1 minuto
    },

    /**
     * Inicializa telemetria
     */
    init() {
        // Verificar consentimento
        this.isEnabled = localStorage.getItem('cromva_telemetry_consent') === 'true';

        if (this.isEnabled) {
            this.sessionId = this._generateSessionId();
            this._startFlushTimer();
            console.log('[Telemetry] Enabled with session:', this.sessionId);
        }
    },

    /**
     * Habilita telemetria (requer consentimento explícito)
     */
    enable() {
        localStorage.setItem('cromva_telemetry_consent', 'true');
        this.isEnabled = true;
        this.sessionId = this._generateSessionId();
        this._startFlushTimer();

        this.track('telemetry_enabled');
        console.log('[Telemetry] Enabled');
    },

    /**
     * Desabilita telemetria
     */
    disable() {
        localStorage.setItem('cromva_telemetry_consent', 'false');
        this.isEnabled = false;
        this.events = [];

        if (this._flushTimer) {
            clearInterval(this._flushTimer);
        }

        console.log('[Telemetry] Disabled');
    },

    /**
     * Rastreia evento
     */
    track(eventName, properties = {}) {
        if (!this.isEnabled) return;

        const event = {
            event: eventName,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            properties: this._sanitizeProperties(properties)
        };

        this.events.push(event);

        // Flush se atingir batch size
        if (this.events.length >= this.config.batchSize) {
            this.flush();
        }
    },

    /**
     * Rastreia feature usage
     */
    trackFeature(featureName) {
        this.track('feature_used', { feature: featureName });
    },

    /**
     * Rastreia erro
     */
    trackError(errorType, errorMessage) {
        this.track('error', {
            type: errorType,
            message: errorMessage.substring(0, 100) // Limitar tamanho
        });
    },

    /**
     * Rastreia performance
     */
    trackPerformance(metric, value) {
        this.track('performance', {
            metric,
            value: Math.round(value)
        });
    },

    /**
     * Sanitiza propriedades (remove dados sensíveis)
     */
    _sanitizeProperties(props) {
        const sanitized = {};
        const sensitiveKeys = ['password', 'token', 'key', 'secret', 'email', 'content'];

        for (const [key, value] of Object.entries(props)) {
            // Não incluir chaves sensíveis
            if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
                continue;
            }

            // Limitar tamanho de strings
            if (typeof value === 'string') {
                sanitized[key] = value.substring(0, 50);
            } else if (typeof value === 'number' || typeof value === 'boolean') {
                sanitized[key] = value;
            }
        }

        return sanitized;
    },

    /**
     * Envia eventos para servidor
     */
    async flush() {
        if (!this.isEnabled || this.events.length === 0) return;
        if (!this.config.endpoint) {
            // Sem endpoint configurado - apenas log local
            console.debug('[Telemetry] Events buffered:', this.events.length);
            // Limpar eventos antigos para não consumir memória
            while (this.events.length > 100) {
                this.events.shift();
            }
            return;
        }

        const eventsToSend = [...this.events];
        this.events = [];

        try {
            await fetch(this.config.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    version: '1.0',
                    events: eventsToSend
                })
            });
        } catch (e) {
            // Recolocar eventos na fila em caso de erro
            this.events = [...eventsToSend, ...this.events];
            console.warn('[Telemetry] Flush failed:', e.message);
        }
    },

    /**
     * Inicia timer de flush
     */
    _startFlushTimer() {
        this._flushTimer = setInterval(() => {
            this.flush();
        }, this.config.flushInterval);
    },

    /**
     * Gera ID de sessão
     */
    _generateSessionId() {
        return 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Mostra UI de consentimento
     */
    showConsentUI() {
        const overlay = document.createElement('div');
        overlay.id = 'telemetry-consent';
        overlay.className = 'fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4';

        overlay.innerHTML = `
            <div class="max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-center">
                <div class="text-4xl mb-4">📊</div>
                <h2 class="text-xl font-bold text-white mb-2">Ajude a melhorar o Cromva</h2>
                <p class="text-zinc-400 mb-6 text-sm">
                    Podemos coletar dados anônimos de uso para melhorar a aplicação?
                    Nenhum dado pessoal ou conteúdo de notas é coletado.
                </p>
                
                <div class="flex gap-3 justify-center">
                    <button onclick="Telemetry.enable(); document.getElementById('telemetry-consent').remove();" 
                            class="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500">
                        ✓ Aceitar
                    </button>
                    <button onclick="Telemetry.disable(); document.getElementById('telemetry-consent').remove();"
                            class="px-6 py-3 bg-zinc-700 text-zinc-300 rounded-lg font-medium hover:bg-zinc-600">
                        Recusar
                    </button>
                </div>
                
                <p class="mt-4 text-xs text-zinc-500">
                    Você pode alterar isso nas configurações a qualquer momento.
                </p>
            </div>
        `;

        document.body.appendChild(overlay);
    },

    /**
     * Retorna status
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            sessionId: this.sessionId,
            pendingEvents: this.events.length
        };
    }
};

// Export global
window.Telemetry = Telemetry;
