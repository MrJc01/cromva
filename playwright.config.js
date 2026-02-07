// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Configuração do Playwright para Cromva
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
    testDir: './scripts/e2e',

    /* Run tests in files in parallel */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,

    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [
        ['html', { open: 'never' }],
        ['list']
    ],

    /* Shared settings for all the projects below. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://localhost:8080',

        /* Collect trace when retrying the failed test. */
        trace: 'on-first-retry',

        /* Screenshots on failure */
        screenshot: 'only-on-failure',

        /* Video recording */
        video: 'retain-on-failure',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npx http-server -p 8080 -c-1',
        url: 'http://localhost:8080',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});
