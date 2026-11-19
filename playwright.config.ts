import { defineConfig, devices } from '@playwright/test'

/**
 * Pruebas de navegador (Playwright). Por defecto revisa el frontend publicado en Render;
 * con GENLOGS_URL=http://localhost:5173 revisa el de `npm run dev`.
 *   $env:GENLOGS_CLAVE = '...'   (clave de demo.jefe; no se guarda en el repo)
 *   npm run e2e                   y luego   npx playwright show-report
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  workers: 1, // el backend gratuito de Render no aguanta muchas páginas a la vez
  reporter: [['html', { outputFolder: 'e2e-reporte', open: 'never' }], ['list']],
  use: {
    baseURL: process.env.GENLOGS_URL ?? 'https://genlogs-frontend-kym5.onrender.com',
    viewport: { width: 1366, height: 768 },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'sesion', testMatch: /sesion\.setup\.ts/, use: { channel: process.env.PW_CHANNEL } },
    {
      name: 'chrome',
      // PW_CHANNEL=chrome usa el Chrome instalado en vez del Chromium de Playwright.
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 }, channel: process.env.PW_CHANNEL },
      dependencies: ['sesion'],
    },
  ],
})
