import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { paginasVisibles } from "../lib/paginasVisibles"

interface PaginacionProps {
  pagina: number
  total: number
  onCambiar: (pagina: number) => void
}

const base =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border border-border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

/** Paginación con flechas para la vitrina. No se muestra si hay una sola página. */
export function Paginacion({ pagina, total, onCambiar }: PaginacionProps) {
  if (total <= 1) return null
  return (
    <nav aria-label="Páginas de repuestos" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onCambiar(pagina - 1)}
        disabled={pagina === 1}
        className={cn(base, "bg-card hover:bg-muted disabled:pointer-events-none disabled:opacity-40")}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Anterior</span>
        <span className="sr-only sm:hidden">Página anterior</span>
      </button>

      {paginasVisibles(pagina, total).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground" aria-hidden="true">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onCambiar(p)}
            aria-label={`Página ${p}`}
            aria-current={p === pagina ? "page" : undefined}
            className={cn(
              base,
              p === pagina ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onCambiar(pagina + 1)}
        disabled={pagina === total}
        className={cn(base, "bg-card hover:bg-muted disabled:pointer-events-none disabled:opacity-40")}
      >
        <span className="hidden sm:inline">Siguiente</span>
        <span className="sr-only sm:hidden">Página siguiente</span>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  )
}