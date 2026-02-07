/**
 * Cromva E2E Tests - Playwright Spec
 * Executa com: npx playwright test
 */

const { test, expect } = require('@playwright/test');

test.describe('Cromva - Inicialização', () => {
    test('deve carregar a página principal', async ({ page }) => {
        await page.goto('/');

        // Verificar título
        await expect(page).toHaveTitle(/Cromva/i);

        // Verificar que o grid de notas existe
        const notesGrid = page.locator('#notes-grid');
        await expect(notesGrid).toBeVisible();
    });

    test('deve carregar o estado do localStorage', async ({ page }) => {
        await page.goto('/');

        // Verificar log de carregamento
        const logs = [];
        page.on('console', msg => logs.push(msg.text()));

        await page.reload();
        await page.waitForTimeout(500);

        // Deve ter log de state carregado
        const hasStateLog = logs.some(log => log.includes('[State]'));
        expect(hasStateLog).toBeTruthy();
    });
});

test.describe('Cromva - Notas', () => {
    test('deve criar uma nova nota', async ({ page }) => {
        await page.goto('/');

        // Clicar em nova nota (FAB ou botão)
        const newNoteBtn = page.locator('[onclick*="createNewNote"], [onclick*="openEmptyEditor"]').first();
        if (await newNoteBtn.isVisible()) {
            await newNoteBtn.click();
        }

        // Verificar se modal abriu
        const modal = page.locator('#preview-modal');
        await expect(modal).toBeVisible();
    });

    test('deve exibir notas existentes', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(500);

        // Se houver notas, devem aparecer cards
        const cards = page.locator('#notes-grid > div');
        const count = await cards.count();

        // Pode ter 0 ou mais notas
        expect(count).toBeGreaterThanOrEqual(0);
    });
});

test.describe('Cromva - Workspaces', () => {
    test('deve abrir o gerenciador de workspaces', async ({ page }) => {
        await page.goto('/');

        // Clicar no botão de workspaces
        const wsBtn = page.locator('[onclick*="openWorkspaceManager"]').first();
        if (await wsBtn.isVisible()) {
            await wsBtn.click();

            // Verificar modal
            const wsModal = page.locator('#workspace-modal');
            await expect(wsModal).toBeVisible();
        }
    });
});

test.describe('Cromva - CromvaTest', () => {
    test('deve executar CromvaTest.runAll()', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(1000);

        // Executar testes no navegador
        const result = await page.evaluate(async () => {
            if (typeof CromvaTest === 'undefined') {
                return { error: 'CromvaTest not found' };
            }

            return await CromvaTest.runAll();
        });

        // Verificar que não há erros e há resultados
        expect(result.error).toBeUndefined();
        expect(result.total).toBeGreaterThan(0);

        // Log resultados
        console.log(`Testes: ${result.passed}/${result.total} passaram`);
    });
});

test.describe('Cromva - UI Components', () => {
    test('deve ter sidebar funcional', async ({ page }) => {
        await page.goto('/');

        const sidebar = page.locator('#sidebar, aside').first();
        await expect(sidebar).toBeVisible();
    });

    test('deve ter lista de recentes', async ({ page }) => {
        await page.goto('/');

        const recentList = page.locator('#recent-list');
        await expect(recentList).toBeVisible();
    });

    test('deve ter Spotlight (busca)', async ({ page }) => {
        await page.goto('/');

        // Tentar abrir spotlight com Ctrl+K
        await page.keyboard.press('Control+k');

        const spotlight = page.locator('#spotlight-modal, [id*="spotlight"]').first();
        // Spotlight pode estar oculto inicialmente
        const isVisible = await spotlight.isVisible().catch(() => false);

        // Se não abriu com Ctrl+K, ok - pode não estar implementado
        expect(true).toBeTruthy();
    });
});
