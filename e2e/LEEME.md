# Lighthouse y Playwright en GENLOGS (frontend)

Las dos herramientas revisan el frontend publicado en Render por defecto.
Para revisar el de `npm run dev`, define `GENLOGS_URL=http://localhost:5173`.

## Una sola vez

```powershell
npm install
npx playwright install chromium
```

## Credenciales (no se guardan en el repo)

```powershell
$env:GENLOGS_USUARIO = 'demo.jefe'   # opcional, es el valor por defecto
$env:GENLOGS_CLAVE   = '...'         # clave de demo.jefe
```

Sin `GENLOGS_CLAVE` solo se revisan las páginas públicas (landing, login, portal).

## Playwright: capturar el debug de cada página

```powershell
npm run e2e
npx playwright show-report e2e-reporte
```

Por cada módulo de `e2e/modulos.ts` guarda en el reporte:

- una captura de pantalla completa;
- un JSON con errores de consola, avisos, errores de JavaScript, peticiones fallidas (4xx/5xx), tiempo de carga y si el rol no tiene acceso.

La prueba falla si la página lanza un error de JavaScript o si el API responde 5xx.

## Lighthouse: rendimiento por módulo

```powershell
npm run lighthouse
```

Deja en `lighthouse-reportes/` un `.html` por módulo y `resumen.csv` con rendimiento, accesibilidad, buenas prácticas, SEO, LCP, TBT y CLS.
Para medir solo algunos módulos: `$env:LH_MODULOS = 'Cotizaciones,Clientes'`.

También se puede usar a mano: Chrome → F12 → pestaña Lighthouse → «Analyze page load».

## Notas

- Se ejecuta una página a la vez (`workers: 1`) para no saturar el backend de Render.
- La primera página puede tardar porque el backend «despierta».
- Para agregar o quitar módulos, se edita solo `e2e/modulos.ts`.
