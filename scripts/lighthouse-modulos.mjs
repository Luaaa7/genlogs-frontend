/**
 * Lighthouse por módulo: rendimiento, accesibilidad, buenas prácticas y SEO de cada página.
 * Inicia sesión con Playwright en un Chrome con puerto de depuración y le pasa ese mismo
 * Chrome a Lighthouse, así las páginas internas se miden con la sesión iniciada.
 *
 *   $env:GENLOGS_CLAVE = '...'      (clave de demo.jefe)
 *   npm run lighthouse              → lighthouse-reportes/*.html y resumen.csv
 * Opcional: GENLOGS_URL, GENLOGS_USUARIO, LH_MODULOS="Cotizaciones,Clientes" para medir solo esos.
 */
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'
import lighthouse from 'lighthouse'

const BASE = process.env.GENLOGS_URL ?? 'https://genlogs-frontend-kym5.onrender.com'
const USUARIO = process.env.GENLOGS_USUARIO ?? 'demo.jefe'
const CLAVE = process.env.GENLOGS_CLAVE
const PUERTO = 9222
const SALIDA = 'lighthouse-reportes'

// Misma lista que Playwright (e2e/modulos.ts), leída sin compilar TypeScript.
const fuente = fs.readFileSync('e2e/modulos.ts', 'utf8')
const leer = (bloque) => [...(fuente.match(new RegExp(`export const ${bloque}[^=]*= \\[([\\s\\S]*?)\\n\\]`))?.[1] ?? '')
  .matchAll(/nombre: '([^']+)', ruta: '([^']+)'/g)]
  .map(([, nombre, ruta]) => ({ nombre, ruta }))
let modulos = [...leer('PUBLICAS'), ...(CLAVE ? leer('INTERNAS') : [])]
if (process.env.LH_MODULOS) {
  const elegidos = process.env.LH_MODULOS.split(',').map((s) => s.trim())
  modulos = modulos.filter((m) => elegidos.includes(m.nombre))
}

fs.mkdirSync(SALIDA, { recursive: true })
const navegador = await chromium.launch({ channel: process.env.PW_CHANNEL, args: [`--remote-debugging-port=${PUERTO}`] })
const contexto = await navegador.newContext()
const pagina = await contexto.newPage()

if (CLAVE) {
  await pagina.goto(`${BASE}/login`)
  await pagina.locator('#login-usuario').fill(USUARIO)
  await pagina.locator('#login-password').fill(CLAVE)
  await pagina.getByRole('button', { name: 'Ingresar' }).click()
  await pagina.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 90_000 })
} else {
  console.log('Sin GENLOGS_CLAVE: solo se miden las páginas públicas.')
}

const filas = [['modulo', 'ruta', 'rendimiento', 'accesibilidad', 'buenas_practicas', 'seo', 'LCP_ms', 'TBT_ms', 'CLS']]
for (const m of modulos) {
  process.stdout.write(`Lighthouse · ${m.nombre}… `)
  const r = await lighthouse(`${BASE}${m.ruta}`, {
    port: PUERTO,
    output: 'html',
    disableStorageReset: true, // conserva la sesión iniciada
    logLevel: 'error',
  }, {
    extends: 'lighthouse:default',
    settings: { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1366, height: 768, deviceScaleFactor: 1, disabled: false }, throttlingMethod: 'simulate' },
  })
  const archivo = path.join(SALIDA, `${m.nombre.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.html`)
  fs.writeFileSync(archivo, r.report)
  const c = r.lhr.categories
  const a = r.lhr.audits
  const pct = (x) => Math.round((x?.score ?? 0) * 100)
  filas.push([m.nombre, m.ruta, pct(c.performance), pct(c.accessibility), pct(c['best-practices']), pct(c.seo),
    Math.round(a['largest-contentful-paint']?.numericValue ?? 0), Math.round(a['total-blocking-time']?.numericValue ?? 0),
    (a['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3)])
  console.log(`rendimiento ${pct(c.performance)} · accesibilidad ${pct(c.accessibility)}`)
}

// BOM + «;» para que Excel en español muestre las tildes y separe las columnas.
fs.writeFileSync(path.join(SALIDA, 'resumen.csv'), '\uFEFF' + filas.map((f) => f.join(';')).join('\r\n'))

await navegador.close()
console.log(`Listo: ${SALIDA}/resumen.csv y un .html por módulo.`)
