import { Check } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { ETAPAS_PEDIDO, esEstadoFinalSinCotizar, etapaDelPedido } from "../lib/estadoPedido"

/** Punto de la etapa actual: pulsa con un ping discreto mientras el pedido avanza; en la etapa final queda fijo. */
function PuntoActivo({ pulsa }: { pulsa: boolean }) {
  return (
    <span data-testid="punto-activo" aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
      {pulsa && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2E6BA8] opacity-40 motion-reduce:animate-none dark:bg-[#60A5FA]" />}
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#2E6BA8] dark:bg-[#60A5FA]" />
    </span>
  )
}

/**
 * Línea de 4 etapas de la tarjeta del pedido (Recibida, En búsqueda, En espera de proveedor, Cotizada),
 * con círculos, check en lo completado y el punto de la etapa en curso. Solo estados, sin fechas ni colores
 * de alerta (P9). Un pedido cancelado o que no se pudo cotizar no la muestra: su estado ya está en la insignia.
 */
export function ProgresoPedido({ estado, etiqueta, className = "" }: { estado: string; etiqueta: string; className?: string }) {
  if (esEstadoFinalSinCotizar(estado)) return null
  const actual = etapaDelPedido(estado)
  const ultima = ETAPAS_PEDIDO.length - 1
  return (
    <ol aria-label={etiqueta} className={cn("grid grid-cols-4", className)}>
      {ETAPAS_PEDIDO.map((etapa, i) => {
        const completada = i < actual
        const enCurso = i === actual
        const alcanzada = completada || enCurso
        return (
          <li key={etapa.estado} aria-current={enCurso ? "step" : undefined} className="flex min-w-0 flex-col items-center text-center">
            <div aria-hidden="true" className="flex w-full items-center">
              <span className={cn("h-1 flex-1 rounded-full", i === 0 ? "invisible" : alcanzada ? "bg-[#2E6BA8] dark:bg-[#3B82F6]" : "bg-slate-200 dark:bg-white/10")} />
              <span
                className={cn(
                  "relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 sm:h-7 sm:w-7",
                  completada && "border-[#2E6BA8] bg-[#2E6BA8] text-white dark:border-[#3B82F6] dark:bg-[#3B82F6]",
                  enCurso && "border-[#2E6BA8] bg-white ring-4 ring-[#2E6BA8]/15 dark:border-[#60A5FA] dark:bg-[#0B1830] dark:ring-[#60A5FA]/20",
                  !alcanzada && "border-slate-300 bg-white dark:border-white/20 dark:bg-[#0B1830]",
                )}
              >
                {completada && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                {enCurso && <PuntoActivo pulsa={i < ultima} />}
              </span>
              <span className={cn("h-1 flex-1 rounded-full", i === ultima ? "invisible" : completada ? "bg-[#2E6BA8] dark:bg-[#3B82F6]" : "bg-slate-200 dark:bg-white/10")} />
            </div>
            <span className={cn("mt-2 block px-0.5 text-[11px] leading-tight sm:text-xs", enCurso ? "font-semibold text-[#183153] dark:text-slate-100" : alcanzada ? "text-slate-600 dark:text-slate-300" : "text-muted-foreground")}>
              {etapa.etiqueta}
            </span>
            <span className="sr-only">{completada ? "(completada)" : enCurso ? "(en curso)" : "(pendiente)"}</span>
          </li>
        )
      })}
    </ol>
  )
}
