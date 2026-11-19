import { lazy, Suspense, type ComponentType } from 'react'

/**
 * Carga una página solo cuando se abre su ruta (code splitting). Así la landing y el login no
 * descargan el código de todo el sistema interno. `nombre` es el export de la página
 * ('default' para las que se exportan por defecto).
 */
export function perezosa<M extends Record<string, unknown>>(cargar: () => Promise<M>, nombre: keyof M & string) {
  const Pagina = lazy(() => cargar().then((m) => ({ default: m[nombre] as ComponentType })))
  return function PaginaPerezosa() {
    return (
      <Suspense fallback={<p role="status" className="p-6 text-sm text-muted-foreground">Cargando…</p>}>
        <Pagina />
      </Suspense>
    )
  }
}
