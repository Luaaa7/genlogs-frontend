import { lazy, Suspense, type ComponentType } from 'react'
import { FallbackPublico } from '@/router/FallbackPublico'

/**
 * Carga una página solo cuando se abre su ruta (code splitting). Así la landing y el login no
 * descargan el código de todo el sistema interno. `nombre` es el export de la página
 * ('default' para las que se exportan por defecto). Con `publica: true` la espera se ve como una barra fina
 * con el emblema (FallbackPublico) en lugar del aviso sencillo de las vistas internas.
 */
export function perezosa<M extends Record<string, unknown>>(
  cargar: () => Promise<M>,
  nombre: keyof M & string,
  opciones: { publica?: boolean } = {},
) {
  const Pagina = lazy(() => cargar().then((m) => ({ default: m[nombre] as ComponentType })))
  return function PaginaPerezosa() {
    return (
      <Suspense fallback={opciones.publica ? <FallbackPublico /> : <p role="status" className="p-6 text-sm text-muted-foreground">Cargando…</p>}>
        <Pagina />
      </Suspense>
    )
  }
}
