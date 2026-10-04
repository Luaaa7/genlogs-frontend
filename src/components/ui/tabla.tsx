import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/utils"

/** Piezas de tabla con un solo estilo para todos los listados: cabecera
 *  discreta, filas con separador fino, montos a la derecha con cifras tabulares. */

export function TablaCard({ barra, children, pie }: { barra?: ReactNode; children: ReactNode; pie?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      {barra && <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">{barra}</div>}
      {children}
      {pie}
    </section>
  )
}

export function Tabla({ titulo, children, minWidth = 720 }: { titulo: string; children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        <caption className="sr-only">{titulo}</caption>
        {children}
      </table>
    </div>
  )
}

export function Th({ className, alinear, ...props }: ThHTMLAttributes<HTMLTableCellElement> & { alinear?: "derecha" }) {
  return (
    <th
      className={cn("border-b border-border px-4 py-2.5 text-left text-xs font-medium text-muted-foreground", alinear === "derecha" && "text-right", className)}
      {...props}
    />
  )
}

export function Td({ className, alinear, ...props }: TdHTMLAttributes<HTMLTableCellElement> & { alinear?: "derecha" }) {
  return <td className={cn("px-4 py-3 align-middle", alinear === "derecha" && "text-right tabular-nums", className)} {...props} />
}

export const filaClass = "border-t border-border first:border-t-0 hover:bg-muted/60"

/** Selects e inputs de las barras de filtros. */
export const controlClass =
  "h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

interface PaginacionProps {
  pagina: number
  totalPaginas: number
  total: number
  enPagina: number
  tamano: number
  onPagina: (pagina: number) => void
  onTamano?: (tamano: number) => void
}

/** Pie de tabla: "Mostrando 1–10 de 38", filas por página y hasta 5 páginas visibles. */
export function Paginacion({ pagina, totalPaginas, total, enPagina, tamano, onPagina, onTamano }: PaginacionProps) {
  if (total === 0) return null
  const desde = pagina * tamano + 1
  const hasta = pagina * tamano + enPagina
  const inicio = Math.max(0, Math.min(pagina - 2, totalPaginas - 5))
  const paginas = Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => inicio + i)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[13px]">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span>Mostrando <span className="tabular-nums">{desde}–{hasta}</span> de <span className="tabular-nums">{total}</span></span>
        {onTamano && (
          <>
            <label className="sr-only" htmlFor="tabla-tamano">Filas por página</label>
            <select id="tabla-tamano" value={tamano} onChange={(e) => onTamano(Number(e.target.value))} className={cn(controlClass, "h-8 px-2 text-[13px]")}>
              {[10, 20, 50].map((t) => <option key={t} value={t}>{t} por página</option>)}
            </select>
          </>
        )}
      </div>
      {totalPaginas > 1 && (
        <nav aria-label="Paginación" className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => onPagina(pagina - 1)} disabled={pagina === 0} aria-label="Página anterior">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          {paginas.map((i) => (
            <Button
              key={i}
              variant={i === pagina ? "default" : "ghost"}
              size="sm"
              aria-current={i === pagina ? "page" : undefined}
              onClick={() => onPagina(i)}
              className="min-w-9 tabular-nums"
            >
              {i + 1}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => onPagina(pagina + 1)} disabled={pagina >= totalPaginas - 1} aria-label="Página siguiente">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </nav>
      )}
    </div>
  )
}
