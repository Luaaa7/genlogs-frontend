import { test, expect, type Page } from '@playwright/test'
import { INTERNAS, PUBLICAS, type Modulo } from './modulos'

/**
 * «Testear y capturar los debug de cada página»: abre cada módulo y guarda en el reporte
 * los errores de consola, los errores de JavaScript, las peticiones fallidas (4xx/5xx o sin
 * respuesta), el tiempo de carga y una captura. Falla si la página lanza un error de JavaScript
 * o si una llamada al API responde 5xx.
 */
type Debug = {
  consola: string[]
  avisos: string[]
  errores: string[]
  peticiones: string[]
}

function escuchar(page: Page): Debug {
  const debug: Debug = { consola: [], avisos: [], errores: [], peticiones: [] }
  page.on('console', (m) => {
    if (m.type() === 'error') debug.consola.push(m.text())
    if (m.type() === 'warning') debug.avisos.push(m.text())
  })
  page.on('pageerror', (e) => debug.errores.push(`${e.name}: ${e.message}`))
  page.on('requestfailed', (r) => debug.peticiones.push(`${r.method()} ${r.url()} → ${r.failure()?.errorText ?? 'falló'}`))
  page.on('response', (r) => {
    if (r.status() >= 400) debug.peticiones.push(`${r.request().method()} ${r.url()} → ${r.status()}`)
  })
  return debug
}

async function revisar(page: Page, modulo: Modulo) {
  const debug = escuchar(page)
  const inicio = Date.now()
  await page.goto(modulo.ruta)
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {})
  const ms = Date.now() - inicio
  const sinAcceso = modulo.ruta !== '/dashboard' && new URL(page.url()).pathname === '/dashboard'

  const info = test.info()
  await info.attach(`${modulo.nombre} - captura`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' })
  await info.attach(`${modulo.nombre} - debug`, {
    body: JSON.stringify({ ruta: modulo.ruta, urlFinal: page.url(), sinAcceso, cargaMs: ms, ...debug }, null, 2),
    contentType: 'application/json',
  })
  info.annotations.push({ type: 'carga', description: `${ms} ms${sinAcceso ? ' · sin acceso para este rol' : ''}` })

  expect.soft(debug.errores, 'errores de JavaScript en la página').toEqual([])
  expect.soft(debug.peticiones.filter((p) => /\/api\/.* → 5\d\d$/.test(p)), 'el API respondió 5xx').toEqual([])
}

test.describe('páginas públicas', () => {
  for (const modulo of PUBLICAS) {
    test(modulo.nombre, async ({ page }) => revisar(page, modulo))
  }
})

test.describe('módulos internos', () => {
  test.skip(!process.env.GENLOGS_CLAVE, 'Sin sesión: define GENLOGS_CLAVE.')
  test.use({ storageState: 'e2e/.auth/sesion.json' })
  for (const modulo of INTERNAS) {
    test(modulo.nombre, async ({ page }) => revisar(page, modulo))
  }
})
