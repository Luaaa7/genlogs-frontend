import type { ReactNode } from "react"

export type VarianteEsqueleto = "pedido" | "cotizacion" | "comprobante" | "despacho" | "repuesto"

/** Pieza fantasma: late suave y se queda quieta con «movimiento reducido». */
function Pieza({ parte, className }: { parte: string; className: string }) {
  return <div data-parte={parte} className={`animate-pulse motion-reduce:animate-none rounded bg-slate-200 dark:bg-slate-700 ${className}`} />
}

const TARJETA = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"

function Tarjeta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div data-testid="skeleton-card" aria-hidden="true" className={`${TARJETA} ${className}`}>
      {children}
    </div>
  )
}

/** Tarjeta fantasma con la silueta de la tarjeta real de cada vista del portal. */
export function SkeletonCard({ variante }: { variante: VarianteEsqueleto }) {
  switch (variante) {
    case "pedido":
      return (
        <Tarjeta>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Pieza parte="codigo" className="h-3 w-24" />
              <Pieza parte="titulo" className="h-5 w-2/3" />
              <Pieza parte="descripcion" className="h-3 w-1/2" />
            </div>
            <Pieza parte="insignia" className="h-6 w-24 rounded-full" />
          </div>
          <Pieza parte="progreso" className="mt-5 h-2 w-full rounded-full" />
        </Tarjeta>
      )
    case "cotizacion":
      return (
        <Tarjeta className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <Pieza parte="codigo" className="h-3 w-28" />
            <Pieza parte="titulo" className="h-5 w-1/2" />
          </div>
          <Pieza parte="total" className="h-5 w-20" />
          <Pieza parte="insignia" className="h-6 w-20 rounded-full" />
        </Tarjeta>
      )
    case "comprobante":
      return (
        <Tarjeta>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Pieza parte="codigo" className="h-3 w-28" />
              <Pieza parte="titulo" className="h-5 w-1/2" />
            </div>
            <Pieza parte="insignia" className="h-6 w-24 rounded-full" />
          </div>
          <Pieza parte="detalle" className="mt-4 h-3 w-2/3" />
          <Pieza parte="boton" className="ml-auto mt-4 h-9 w-32 rounded-md" />
        </Tarjeta>
      )
    case "despacho":
      return (
        <Tarjeta>
          <Pieza parte="codigo" className="h-3 w-32" />
          <Pieza parte="titulo" className="mt-3 h-5 w-1/2" />
          <Pieza parte="plazo" className="mt-3 h-3 w-2/5" />
        </Tarjeta>
      )
    case "repuesto":
      return (
        <Tarjeta className="flex flex-col p-4">
          <Pieza parte="imagen" className="h-32 w-full rounded-lg" />
          <Pieza parte="categoria" className="mt-3 h-3 w-20" />
          <Pieza parte="titulo" className="mt-2 h-5 w-3/4" />
          <Pieza parte="detalle" className="mt-2 h-3 w-1/2" />
          <Pieza parte="precio" className="mt-3 h-5 w-24" />
          <Pieza parte="boton" className="mt-4 h-9 w-full rounded-md" />
        </Tarjeta>
      )
  }
}

/** Lista de tarjetas fantasma para la carga inicial. Avisa a los lectores de pantalla con `etiqueta`. */
export function ListaEsqueleto({ variante, etiqueta, cantidad = 3 }: { variante: VarianteEsqueleto; etiqueta: string; cantidad?: number }) {
  const disposicion = variante === "repuesto" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-3"
  return (
    <div role="status" aria-busy="true" className={disposicion}>
      <span className="sr-only">{etiqueta}</span>
      {Array.from({ length: cantidad }, (_, i) => <SkeletonCard key={i} variante={variante} />)}
    </div>
  )
}
