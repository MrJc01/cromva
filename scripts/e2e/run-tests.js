/**
 * Cromva E2E Test Runner
 * Execute com: node scripts/e2e/run-tests.js
 * 
 * Este script inicia um servidor local e executa os testes no navegador,
 * capturando os logs do console para o terminal.
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = path.resolve(__dirname, '../..');

// MIME types
const MIME = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Servidor HTTP simples
function startServer() {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            let filePath = path.join(ROOT, req.url === '/' ? 'index.html' : req.url);
            const ext = path.extname(filePath);
            const contentType = MIME[ext] || 'text/plain';

            fs.readFile(filePath, (err, content) => {
                if (err) {
                    res.writeHead(404);
                    res.end(`File not found: ${req.url}`);
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content);
                }
            });
        });

        server.listen(PORT, () => {
            console.log(`\n🖥️  Servidor iniciado em http://localhost:${PORT}`);
            resolve(server);
        });
    });
}

// Cores para o terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorLog(type, text) {
    const prefix = {
        'log': `${colors.dim}[LOG]${colors.reset}`,
        'info': `${colors.blue}[INFO]${colors.reset}`,
        'warn': `${colors.yellow}[WARN]${colors.reset}`,
        'error': `${colors.red}[ERROR]${colors.reset}`,
        'debug': `${colors.magenta}[DEBUG]${colors.reset}`,
    };
    console.log(`  ${prefix[type] || '[???]'} ${text}`);
}

async function runTests() {
    console.log('\n' + '═'.repeat(60));
    console.log(`${colors.cyan}${colors.bright}  🧪 CROMVA E2E TEST RUNNER${colors.reset}`);
    console.log('═'.repeat(60));

    const server = await startServer();

    console.log(`\n${colors.bright}📦 Iniciando navegador...${colors.reset}`);
    const browser = await chromium.launch({
        headless: true,  // Mude para false para ver o navegador
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Capturar logs do console
    const logs = [];
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        logs.push({ type, text, time: Date.now() });
        colorLog(type, text);
    });

    // Capturar erros da página
    page.on('pageerror', error => {
        console.log(`${colors.red}[PAGE ERROR] ${error.message}${colors.reset}`);
    });

    console.log(`\n${colors.bright}🌐 Abrindo aplicação...${colors.reset}`);
    await page.goto(`http://localhost:${PORT}`);

    // Aguardar carregamento
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    console.log(`\n${colors.bright}🔬 Executando testes...${colors.reset}\n`);
    console.log('-'.repeat(60));

    // Executar CromvaTest.runAll() no contexto do navegador
    const result = await page.evaluate(async () => {
        // Aguardar CromvaTest estar disponível
        if (typeof CromvaTest === 'undefined') {
            return { success: false, error: 'CromvaTest não encontrado' };
        }

        try {
            const results = await CromvaTest.runAll();
            return { success: true, results };
        } catch (e) {
            return { success: false, error: e.message };
        }
    });

    console.log('-'.repeat(60));

    if (result.success) {
        console.log(`\n${colors.green}${colors.bright}✅ Testes executados com sucesso!${colors.reset}`);

        // Mostrar resultados resumidos
        if (result.results) {
            const { passed, failed, total } = result.results;
            console.log(`\n📊 Resultados:`);
            console.log(`   ${colors.green}✓ Passou: ${passed}${colors.reset}`);
            console.log(`   ${colors.red}✗ Falhou: ${failed}${colors.reset}`);
            console.log(`   📋 Total: ${total}`);
        }
    } else {
        console.log(`\n${colors.red}${colors.bright}❌ Erro ao executar testes:${colors.reset}`);
        console.log(`   ${result.error}`);
    }

    // Tirar screenshot final
    const screenshotPath = path.join(__dirname, '../../test-results/final-state.png');
    await fs.promises.mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n📸 Screenshot salvo em: test-results/final-state.png`);

    // Cleanup
    await browser.close();
    server.close();

    console.log('\n' + '═'.repeat(60));
    console.log(`${colors.cyan}  Testes finalizados!${colors.reset}`);
    console.log('═'.repeat(60) + '\n');

    process.exit(result.success ? 0 : 1);
}

// Executar
runTests().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
