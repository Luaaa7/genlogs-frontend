import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { paginasVisibles } from "../lib/catalogo"

interface Props {
  pagina: number
  totalPaginas: number
  onCambiar: (pagina: number) => void
}

const BASE = "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"

/** Anterior, números de página y Siguiente. No se dibuja si hay una sola página. */
export function PaginacionCatalogo({ pagina, totalPaginas, onCambiar }: Props) {
  if (totalPaginas <= 1) return null
  return (
    <nav aria-label="Paginación de repuestos" className="flex flex-wrap items-center justify-center gap-1.5">
      <button type="button" onClick={() => onCambiar(pagina - 1)} disabled={pagina <= 1} className={cn(BASE, "gap-1 border-border bg-card hover:bg-muted")}>
        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Anterior
      </button>
      {paginasVisibles(pagina, totalPaginas).map((p, i) =>
        p === "…" ? (
          <span key={`salto-${i}`} aria-hidden="true" className="px-1 text-muted-foreground">…</span>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={`Página ${p}`}
            aria-current={p === pagina ? "page" : undefined}
            onClick={() => onCambiar(p)}
            className={cn(BASE, "tabular-nums", p === pagina ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted")}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" onClick={() => onCambiar(pagina + 1)} disabled={pagina >= totalPaginas} className={cn(BASE, "gap-1 border-border bg-card hover:bg-muted")}>
        Siguiente <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  )
}
