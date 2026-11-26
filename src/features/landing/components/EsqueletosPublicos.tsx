import { Skeleton } from "@/components/ui/skeleton"
import { VISTA_MAPA_PERU } from "../lib/mapaPeru"

/**
 * Siluetas de carga de la landing pública. Cada una repite las medidas de la pieza real
 * (mismas clases de caja y alturas de línea) para que al llegar los datos nada se desplace.
 * Los fantasmas son decorativos (aria-hidden); cada grupo avisa una sola vez con role="status".
 */

/** Tarjeta fantasma de la vitrina: mismo molde que TarjetaRepuesto (foto 4:3, textos y botón). */
function TarjetaRepuestoFantasma() {
  return (
    <div data-testid="esqueleto-repuesto" aria-hidden="true" className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Skeleton variant="rectangular" className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-1 flex-col p-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-1 h-[2.75rem] w-full" />
        <Skeleton className="mt-2 h-5 w-1/2" />
        <Skeleton className="mt-3 h-5 w-2/3" />
        <Skeleton className="mt-1 h-4 w-3/4" />
        <Skeleton variant="rectangular" className="mt-4 h-9 w-full" />
      </div>
    </div>
  )
}

/** Cuadrícula de tarjetas de repuesto fantasma (vitrina y catálogo de referencia). */
export function EsqueletoRepuestos({ etiqueta, cantidad = 8 }: { etiqueta: string; cantidad?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label={etiqueta} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <span className="sr-only">{etiqueta}...</span>
      {Array.from({ length: cantidad }, (_, i) => <TarjetaRepuestoFantasma key={i} />)}
    </div>
  )
}

const ANCHOS_PILDORA = ["w-16", "w-24", "w-28", "w-20", "w-32", "w-24"]

/** Píldoras de categoría fantasma: misma altura (h-8) y separación que FiltroChips. */
export function EsqueletoCategorias() {
  return (
    <div aria-hidden="true" className="flex flex-wrap gap-2">
      {ANCHOS_PILDORA.map((ancho, i) => (
        <Skeleton key={i} data-testid="esqueleto-categoria" variant="circular" className={`h-8 ${ancho}`} />
      ))}
    </div>
  )
}

/** Fila de marca fantasma, para que el selector no empuje la lista al aparecer. */
export function EsqueletoMarca() {
  return (
    <div data-testid="esqueleto-marca" aria-hidden="true" className="flex items-center gap-3">
      <Skeleton className="h-5 w-12" />
      <Skeleton variant="rectangular" className="h-10 w-44" />
    </div>
  )
}

/** Cobertura minera: mapa, buscador y las 6 unidades iniciales (3 filas de 2) con el molde de la tarjeta real. */
export function EsqueletoCobertura({ cantidad = 6 }: { cantidad?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando cobertura" className="mt-8 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
      <span className="sr-only">Cargando cobertura...</span>
      <div aria-hidden="true" className="mx-auto w-full max-w-sm">
        <Skeleton
          variant="rectangular"
          className="w-full"
          style={{ aspectRatio: `${VISTA_MAPA_PERU.ancho} / ${VISTA_MAPA_PERU.alto}` }}
        />
      </div>
      <div aria-hidden="true" className="space-y-3">
        <Skeleton variant="rectangular" className="h-11 w-full rounded-xl" />
        <Skeleton className="h-5 w-32" />
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: cantidad }, (_, i) => (
            <div key={i} data-testid="esqueleto-unidad" className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
              <Skeleton variant="circular" className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-[1.2rem] w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton variant="rectangular" className="h-[2.625rem] w-64 rounded-xl" />
      </div>
    </div>
  )
}
