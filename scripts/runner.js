/**
 * CROMVA TEST RUNNER
 * 
 * Sistema de testes automatizados para o Cromva.
 * Execute no console: CromvaTest.runAll()
 */

const CromvaTest = {
    results: [],
    currentSuite: null,

    // Cores para console
    styles: {
        pass: 'color: #10b981; font-weight: bold;',
        fail: 'color: #ef4444; font-weight: bold;',
        suite: 'color: #3b82f6; font-weight: bold; font-size: 14px;',
        info: 'color: #6b7280;',
        title: 'color: #f59e0b; font-weight: bold; font-size: 16px;'
    },

    // === ASSERTIONS ===
    assert(condition, message) {
        if (condition) {
            this.pass(message);
        } else {
            this.fail(message);
        }
        return condition;
    },

    assertEqual(actual, expected, message) {
        const pass = actual === expected;
        if (pass) {
            this.pass(`${message}: ${actual}`);
        } else {
            this.fail(`${message}: esperado "${expected}", recebeu "${actual}"`);
        }
        return pass;
    },

    assertExists(value, message) {
        const pass = value !== undefined && value !== null;
        if (pass) {
            this.pass(`${message}: existe`);
        } else {
            this.fail(`${message}: não existe (${value})`);
        }
        return pass;
    },

    assertType(value, type, message) {
        const actualType = typeof value;
        const pass = actualType === type;
        if (pass) {
            this.pass(`${message}: tipo correto (${type})`);
        } else {
            this.fail(`${message}: esperado tipo "${type}", recebeu "${actualType}"`);
        }
        return pass;
    },

    assertArrayLength(arr, length, message) {
        const actualLength = arr?.length ?? 0;
        const pass = actualLength === length;
        if (pass) {
            this.pass(`${message}: length = ${length}`);
        } else {
            this.fail(`${message}: esperado length ${length}, recebeu ${actualLength}`);
        }
        return pass;
    },

    // === LOGGING ===
    pass(message) {
        console.log(`%c  ✓ PASS%c ${message}`, this.styles.pass, this.styles.info);
        this.results.push({ suite: this.currentSuite, status: 'pass', message });
    },

    fail(message) {
        console.log(`%c  ✗ FAIL%c ${message}`, this.styles.fail, this.styles.info);
        this.results.push({ suite: this.currentSuite, status: 'fail', message });
    },

    // === SUITES ===
    suite(name, tests) {
        console.log(`\n%c▸ ${name}`, this.styles.suite);
        this.currentSuite = name;
        try {
            tests();
        } catch (e) {
            this.fail(`Erro na suite: ${e.message}`);
            console.error(e);
        }
    },

    // === TEST REGISTRY ===
    tests: {},

    register(name, fn) {
        this.tests[name] = fn;
    },

    // === RUNNERS ===
    run(name) {
        if (!this.tests[name]) {
            console.error(`Teste "${name}" não encontrado`);
            return;
        }
        console.log(`%c🧪 CROMVA TESTS - ${name.toUpperCase()}`, this.styles.title);
        this.results = [];
        this.tests[name]();
        this.summary();
    },

    runAll() {
        console.log(`%c🧪 CROMVA TESTS - FULL SUITE`, this.styles.title);
        console.log(`%cExecutando ${Object.keys(this.tests).length} suites...`, this.styles.info);
        this.results = [];

        for (const name of Object.keys(this.tests)) {
            this.tests[name]();
        }

        this.summary();
    },

    summary() {
        const passed = this.results.filter(r => r.status === 'pass').length;
        const failed = this.results.filter(r => r.status === 'fail').length;
        const total = this.results.length;

        console.log('\n' + '─'.repeat(50));
        console.log(`%c📊 RESULTADO: ${passed}/${total} passed`,
            failed === 0 ? this.styles.pass : this.styles.fail);

        if (failed > 0) {
            console.log(`%c\n❌ FALHAS:`, this.styles.fail);
            this.results
                .filter(r => r.status === 'fail')
                .forEach(r => console.log(`   • [${r.suite}] ${r.message}`));
        }
        console.log('─'.repeat(50));

        return { passed, failed, total };
    },

    // === UTILITIES ===
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    mock: {
        note: (overrides = {}) => ({
            id: Date.now(),
            title: 'Test Note',
            content: '# Test\n\nContent here',
            category: 'Sistema',
            date: new Date().toISOString(),
            ...overrides
        }),

        workspace: (overrides = {}) => ({
            id: Date.now(),
            name: 'Test Workspace',
            desc: 'Test description',
            color: 'blue',
            date: new Date().toISOString(),
            ...overrides
        })
    }
};

// Expor globalmente
window.CromvaTest = CromvaTest;

console.log('%c🧪 CromvaTest carregado! Use CromvaTest.runAll() para testar',
    'font-size: 12px; color: #3b82f6;');
