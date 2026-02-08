/**
 * Cromva Performance Metrics
 * Métricas de performance
 */

const PerformanceMetrics = {
    // Medições
    measurements: new Map(),

    // Histórico
    history: [],
    maxHistory: 100,

    /**
     * Inicia medição
     */
    start(name) {
        this.measurements.set(name, {
            start: performance.now(),
            marks: []
        });
    },

    /**
     * Adiciona marca intermediária
     */
    mark(name, label) {
        const m = this.measurements.get(name);
        if (!m) return;

        m.marks.push({
            label,
            time: performance.now() - m.start
        });
    },

    /**
     * Finaliza medição
     */
    end(name) {
        const m = this.measurements.get(name);
        if (!m) return null;

        const duration = performance.now() - m.start;
        this.measurements.delete(name);

        const result = {
            name,
            duration,
            marks: m.marks,
            timestamp: new Date().toISOString()
        };

        this.history.push(result);
        while (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        return result;
    },

    /**
     * Mede função
     */
    async measure(name, fn) {
        this.start(name);
        try {
            return await fn();
        } finally {
            this.end(name);
        }
    },

    /**
     * Retorna estatísticas de memória
     */
    getMemoryStats() {
        if (!('memory' in performance)) {
            return null;
        }

        const mem = performance.memory;
        return {
            usedHeap: mem.usedJSHeapSize,
            totalHeap: mem.totalJSHeapSize,
            heapLimit: mem.jsHeapSizeLimit,
            usedPercent: ((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100).toFixed(1)
        };
    },

    /**
     * Retorna métricas de navegação
     */
    getNavigationMetrics() {
        const nav = performance.getEntriesByType('navigation')[0];
        if (!nav) return null;

        return {
            dns: nav.domainLookupEnd - nav.domainLookupStart,
            connection: nav.connectEnd - nav.connectStart,
            ttfb: nav.responseStart - nav.requestStart,
            download: nav.responseEnd - nav.responseStart,
            domParsing: nav.domInteractive - nav.responseEnd,
            domComplete: nav.domComplete - nav.domInteractive,
            total: nav.loadEventEnd - nav.startTime
        };
    },

    /**
     * Retorna histórico de medições
     */
    getHistory(name = null) {
        if (name) {
            return this.history.filter(h => h.name === name);
        }
        return [...this.history];
    },

    /**
     * Retorna média de duração
     */
    getAverage(name) {
        const measurements = this.getHistory(name);
        if (measurements.length === 0) return 0;

        const total = measurements.reduce((sum, m) => sum + m.duration, 0);
        return total / measurements.length;
    },

    /**
     * Limpa histórico
     */
    clear() {
        this.measurements.clear();
        this.history = [];
    },

    /**
     * Exporta métricas
     */
    export() {
        return JSON.stringify({
            exportedAt: new Date().toISOString(),
            memory: this.getMemoryStats(),
            navigation: this.getNavigationMetrics(),
            measurements: this.history
        }, null, 2);
    }
};

// Export global
window.PerformanceMetrics = PerformanceMetrics;
