/**
 * Cromva Stress Test
 * Testa performance e limites da aplicação
 */

const CromvaStressTest = {
    results: {},

    /**
     * Roda todos os testes de stress
     */
    async runAll() {
        console.log('\n' + '='.repeat(50));
        console.log('%c🔥 CROMVA STRESS TEST', 'color: #f59e0b; font-weight: bold; font-size: 16px;');
        console.log('='.repeat(50));

        await this.testCreateManyNotes(100);
        await this.testRenderPerformance();
        await this.testLocalStorageSize();
        await this.testSearchPerformance();
        await this.testDOMOperations();

        this.printSummary();
        return this.results;
    },

    /**
     * Testa criação de muitas notas
     */
    async testCreateManyNotes(count) {
        console.log(`\n▸ Criando ${count} notas...`);
        const start = performance.now();

        const originalLength = window.notes.length;

        for (let i = 0; i < count; i++) {
            window.notes.push({
                id: Date.now() + i,
                title: `Stress Note ${i}`,
                content: `Content for stress test note ${i}. `.repeat(100),
                category: 'Stress',
                date: new Date().toISOString()
            });
        }

        const createTime = performance.now() - start;
        console.log(`  ✓ Criação: ${createTime.toFixed(2)}ms`);

        // Testar renderização
        const renderStart = performance.now();
        renderNotes();
        const renderTime = performance.now() - renderStart;
        console.log(`  ✓ Renderização: ${renderTime.toFixed(2)}ms`);

        // Cleanup
        window.notes = window.notes.slice(0, originalLength);
        renderNotes();

        this.results.createNotes = {
            count,
            createTime,
            renderTime,
            avgCreate: createTime / count,
            avgRender: renderTime / count
        };
    },

    /**
     * Testa performance de re-render
     */
    async testRenderPerformance() {
        console.log('\n▸ Testando re-render performance...');
        const iterations = 50;
        const times = [];

        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            renderNotes();
            times.push(performance.now() - start);
        }

        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);

        console.log(`  ✓ Média: ${avg.toFixed(2)}ms (min: ${min.toFixed(2)}ms, max: ${max.toFixed(2)}ms)`);

        this.results.renderPerformance = { avg, min, max, iterations };
    },

    /**
     * Testa tamanho do localStorage
     */
    async testLocalStorageSize() {
        console.log('\n▸ Analisando localStorage...');

        let totalSize = 0;
        const breakdown = {};

        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const size = (localStorage[key].length * 2) / 1024; // KB
                totalSize += size;

                if (key.startsWith('cromva')) {
                    breakdown[key] = size.toFixed(2) + ' KB';
                }
            }
        }

        console.log(`  ✓ Total Cromva: ${totalSize.toFixed(2)} KB`);
        console.log('  Breakdown:', breakdown);

        // Testar limite (aprox 5MB)
        const maxTest = 4 * 1024; // 4MB em KB
        const usage = (totalSize / maxTest) * 100;
        console.log(`  ✓ Uso do limite: ${usage.toFixed(2)}%`);

        this.results.localStorageSize = { totalSize, breakdown, usagePercent: usage };
    },

    /**
     * Testa performance de busca
     */
    async testSearchPerformance() {
        console.log('\n▸ Testando performance de busca...');

        const searchTerms = ['test', 'note', 'a', 'notexistent123'];
        const results = {};

        for (const term of searchTerms) {
            const start = performance.now();

            // Simular busca
            const found = window.notes.filter(n =>
                n.title.toLowerCase().includes(term.toLowerCase()) ||
                n.content.toLowerCase().includes(term.toLowerCase())
            );

            const time = performance.now() - start;
            results[term] = { found: found.length, time: time.toFixed(3) + 'ms' };
        }

        console.log('  ✓ Resultados:', results);
        this.results.searchPerformance = results;
    },

    /**
     * Testa operações DOM pesadas
     */
    async testDOMOperations() {
        console.log('\n▸ Testando operações DOM...');

        // Contar elementos
        const elementsCount = document.querySelectorAll('*').length;
        console.log(`  ✓ Total de elementos: ${elementsCount}`);

        // Testar querySelector
        const selectorTests = [
            '#notes-grid',
            '.note-card',
            '[data-lucide]',
            'button',
            'div'
        ];

        const selectorResults = {};
        for (const selector of selectorTests) {
            const start = performance.now();
            const found = document.querySelectorAll(selector).length;
            const time = performance.now() - start;
            selectorResults[selector] = { count: found, time: time.toFixed(3) + 'ms' };
        }

        console.log('  ✓ Seletores:', selectorResults);
        this.results.domOperations = { elementsCount, selectors: selectorResults };
    },

    /**
     * Imprime resumo dos resultados
     */
    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('%c📊 RESUMO DO STRESS TEST', 'color: #10b981; font-weight: bold;');
        console.log('='.repeat(50));

        const r = this.results;

        console.log(`
  📝 Notas
     - Criação ${r.createNotes?.count}: ${r.createNotes?.createTime?.toFixed(2)}ms
     - Média por nota: ${r.createNotes?.avgCreate?.toFixed(3)}ms

  🎨 Render
     - Média: ${r.renderPerformance?.avg?.toFixed(2)}ms
     - Range: ${r.renderPerformance?.min?.toFixed(2)}ms - ${r.renderPerformance?.max?.toFixed(2)}ms

  💾 Storage
     - Uso: ${r.localStorageSize?.totalSize?.toFixed(2)} KB
     - Limite: ${r.localStorageSize?.usagePercent?.toFixed(2)}%

  🌐 DOM
     - Elementos: ${r.domOperations?.elementsCount}
        `);

        console.log('='.repeat(50));
    }
};

// Registrar no CromvaTest se disponível
if (typeof CromvaTest !== 'undefined') {
    CromvaTest.stress = CromvaStressTest;
}

// Export global
window.CromvaStressTest = CromvaStressTest;
