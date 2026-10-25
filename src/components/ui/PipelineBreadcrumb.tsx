import { Link } from "react-router-dom"
import { ArrowUpRight, Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils/utils"

export interface PipelineStep {
  label: string
  /** "completed": ya ocurrió (ej. la cotización que dio origen a esta orden).
   *  "current": la pantalla que se está viendo ahora mismo.
   *  "pending": todavía no existe (ej. la factura de una orden sin facturar). */
  status: "completed" | "current" | "pending"
  href?: string
  /** Texto que explica un paso pendiente, ej. "Aún no hay orden de compra". */
  pendiente?: string
}

/** Cadena del documento: Cotización → Orden de compra → Factura.
 *  Se dibuja como un indicador de pasos (texto con íconos y flechas), no como
 *  pestañas: solo los pasos que ya existen son enlaces (subrayados al pasar el
 *  mouse y con flecha ↗); los pendientes son texto gris con su explicación. */
export function PipelineBreadcrumb({ steps }: { steps: PipelineStep[] }) {
  return (
    <nav aria-label="Cadena del documento">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {steps.map((step, i) => {
          const esEnlace = step.status === "completed" && !!step.href
          const icono =
            step.status === "completed" ? <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
            : step.status === "current" ? <Circle className="h-2.5 w-2.5 fill-current text-accent" aria-hidden="true" />
            : <Circle className="h-2.5 w-2.5 text-muted-foreground/60" aria-hidden="true" />

          return (
            <li key={step.label} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />}
              {esEnlace ? (
                <Link
                  to={step.href!}
                  className="inline-flex items-center gap-1.5 rounded font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {icono}
                  {step.label}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              ) : (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5",
                    step.status === "current" ? "font-semibold text-foreground" : "text-muted-foreground"
                  )}
                  aria-current={step.status === "current" ? "step" : undefined}
                >
                  {icono}
                  {step.label}
                  {step.status === "pending" && step.pendiente && (
                    <span className="text-xs text-muted-foreground/80">· {step.pendiente}</span>
                  )}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}