/**
 * Cromva Test Report Generator
 * Gera relatório detalhado dos testes
 */

const CromvaReport = {
    /**
     * Gera relatório completo
     */
    async generate() {
        console.log('\n' + '═'.repeat(60));
        console.log('%c📋 CROMVA TEST REPORT', 'color: #6366f1; font-weight: bold; font-size: 16px;');
        console.log(`   Generated: ${new Date().toLocaleString()}`);
        console.log('═'.repeat(60));

        const report = {
            timestamp: new Date().toISOString(),
            environment: this.getEnvironment(),
            tests: await this.runAllTests(),
            stress: null,
            summary: {}
        };

        // Rodar stress tests se disponível
        if (typeof CromvaStressTest !== 'undefined') {
            console.log('\n%c🔥 Running Stress Tests...', 'color: #f59e0b;');
            report.stress = await CromvaStressTest.runAll();
        }

        // Calcular summary
        report.summary = this.calculateSummary(report);

        // Imprimir relatório final
        this.printFinalReport(report);

        return report;
    },

    /**
     * Coleta informações do ambiente
     */
    getEnvironment() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen: `${screen.width}x${screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            memory: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'N/A',
            cores: navigator.hardwareConcurrency || 'N/A',
            online: navigator.onLine,
            cookiesEnabled: navigator.cookieEnabled,
            fsApiSupported: 'showDirectoryPicker' in window,
            indexedDbSupported: 'indexedDB' in window
        };
    },

    /**
     * Executa todos os testes e coleta resultados
     */
    async runAllTests() {
        if (typeof CromvaTest === 'undefined') {
            return { error: 'CromvaTest not loaded' };
        }

        const results = await CromvaTest.runAll();
        return results;
    },

    /**
     * Calcula resumo dos resultados
     */
    calculateSummary(report) {
        const tests = report.tests;

        return {
            totalTests: tests.total || 0,
            passed: tests.passed || 0,
            failed: tests.failed || 0,
            passRate: tests.total ? ((tests.passed / tests.total) * 100).toFixed(1) + '%' : 'N/A',
            stressTestsRan: !!report.stress,
            notesCount: window.notes?.length || 0,
            workspacesCount: window.workspaces?.length || 0,
            filesCount: Object.values(window.workspaceFiles || {}).flat().length
        };
    },

    /**
     * Imprime relatório final formatado
     */
    printFinalReport(report) {
        console.log('\n' + '═'.repeat(60));
        console.log('%c📊 FINAL REPORT', 'color: #10b981; font-weight: bold; font-size: 14px;');
        console.log('═'.repeat(60));

        // Ambiente
        console.log('\n%c🖥️ Environment', 'font-weight: bold;');
        console.table(report.environment);

        // Summary
        console.log('\n%c📈 Summary', 'font-weight: bold;');
        console.table(report.summary);

        // Status final
        const s = report.summary;
        const status = s.failed === 0
            ? '%c✅ ALL TESTS PASSED'
            : `%c❌ ${s.failed} TESTS FAILED`;

        const color = s.failed === 0
            ? 'color: #10b981; font-weight: bold; font-size: 16px;'
            : 'color: #ef4444; font-weight: bold; font-size: 16px;';

        console.log('\n' + status, color);
        console.log(`   ${s.passed}/${s.totalTests} (${s.passRate})`);
        console.log('═'.repeat(60) + '\n');
    },

    /**
     * Exporta relatório como JSON
     */
    async exportJSON() {
        const report = await this.generate();
        const json = JSON.stringify(report, null, 2);

        // Criar blob e download
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `cromva-test-report-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('📥 Report exported as JSON');
        return json;
    },

    /**
     * Exporta relatório como Markdown
     */
    async exportMarkdown() {
        const report = await this.generate();
        const s = report.summary;
        const e = report.environment;

        const md = `# Cromva Test Report

## Summary
- **Date**: ${new Date(report.timestamp).toLocaleString()}
- **Tests**: ${s.passed}/${s.totalTests} passed (${s.passRate})
- **Status**: ${s.failed === 0 ? '✅ All Passed' : '❌ Some Failed'}

## Environment
| Property | Value |
|----------|-------|
| Platform | ${e.platform} |
| Screen | ${e.screen} |
| Viewport | ${e.viewport} |
| Memory | ${e.memory} |
| Cores | ${e.cores} |
| FS API | ${e.fsApiSupported ? '✓' : '✗'} |
| IndexedDB | ${e.indexedDbSupported ? '✓' : '✗'} |

## Data Stats
- Notes: ${s.notesCount}
- Workspaces: ${s.workspacesCount}
- Files: ${s.filesCount}

---
*Generated by Cromva Test Report*
`;

        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `cromva-test-report-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('📥 Report exported as Markdown');
        return md;
    }
};

// Export global
window.CromvaReport = CromvaReport;
