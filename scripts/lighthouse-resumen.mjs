/**
 * Rehace lighthouse-reportes/resumen.csv a partir de los .html ya generados (sin volver a medir).
 * Sirve si el CSV estaba abierto en Excel cuando terminó `npm run lighthouse`.
 *   node scripts/lighthouse-resumen.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const SALIDA = 'lighthouse-reportes'
const fuente = fs.readFileSync('e2e/modulos.ts', 'utf8')
const leer = (bloque) => [...(fuente.match(new RegExp(`export const ${bloque}[^=]*= \\[([\\s\\S]*?)\\n\\]`))?.[1] ?? '')
  .matchAll(/nombre: '([^']+)', ruta: '([^']+)'/g)].map(([, nombre, ruta]) => ({ nombre, ruta }))

const filas = [['modulo', 'ruta', 'rendimiento', 'accesibilidad', 'buenas_practicas', 'seo', 'LCP_ms', 'TBT_ms', 'CLS']]
for (const m of [...leer('PUBLICAS'), ...leer('INTERNAS')]) {
  const archivo = path.join(SALIDA, `${m.nombre.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.html`)
  if (!fs.existsSync(archivo)) continue
  const html = fs.readFileSync(archivo, 'utf8')
  const json = html.match(/window\.__LIGHTHOUSE_JSON__ = (\{[\s\S]*?\});<\/script>/)?.[1]
  if (!json) continue
  const lhr = JSON.parse(json)
  const c = lhr.categories
  const a = lhr.audits
  const pct = (x) => Math.round((x?.score ?? 0) * 100)
  filas.push([m.nombre, m.ruta, pct(c.performance), pct(c.accessibility), pct(c['best-practices']), pct(c.seo),
    Math.round(a['largest-contentful-paint']?.numericValue ?? 0), Math.round(a['total-blocking-time']?.numericValue ?? 0),
    (a['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3)])
}
fs.writeFileSync(path.join(SALIDA, 'resumen.csv'), '﻿' + filas.map((f) => f.join(';')).join('\r\n'))
console.log(`resumen.csv con ${filas.length - 1} módulos.`)
