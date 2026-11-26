import { Check, Truck } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { nombreEtapa, type EtapaCodigo } from "@/features/despacho/api/despachoTipos"
import { etapasDelDespacho } from "../lib/etapasDespacho"

/**
 * Línea de progreso del despacho. Es un dibujo (sin listas, para no mezclarse con las tarjetas);
 * los lectores de pantalla reciben una frase con la etapa actual. Si la etapa no es conocida, no se dibuja.
 */
export function EtapasDespacho({ etapa, className }: { etapa: string; className?: string }) {
  const etapas = etapasDelDespacho(etapa)
  const actual = etapas.indexOf(etapa as EtapaCodigo)
  if (actual === -1) return null
  const entregado = etapa === "ENTREGADO"
  return (
    <div className={className}>
      <p className="sr-only">Etapa {actual + 1} de {etapas.length}: {nombreEtapa(etapas[actual])}</p>
      <div aria-hidden="true" className="grid" style={{ gridTemplateColumns: `repeat(${etapas.length}, minmax(0, 1fr))` }}>
        {etapas.map((codigo, i) => {
          const completada = i < actual || (entregado && i === actual)
          const enCurso = i === actual && !entregado
          const alcanzada = completada || enCurso
          return (
            <div key={codigo} className="flex min-w-0 flex-col items-center text-center">
              <div className="flex w-full items-center">
                <span className={cn("h-1 flex-1 rounded-full", i === 0 ? "invisible" : alcanzada ? "bg-[#2E6BA8] dark:bg-[#3B82F6]" : "bg-slate-200 dark:bg-white/10")} />
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                    completada && "border-[#2E6BA8] bg-[#2E6BA8] text-white dark:border-[#3B82F6] dark:bg-[#3B82F6]",
                    enCurso && "border-[#2E6BA8] bg-[#FACC15] text-[#183153] ring-4 ring-[#FACC15]/25 dark:border-[#FACC15]",
                    !alcanzada && "border-slate-300 bg-white dark:border-white/20 dark:bg-[#0B1830]",
                  )}
                >
                  {completada && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  {enCurso && <Truck className="h-3.5 w-3.5" />}
                </span>
                <span className={cn("h-1 flex-1 rounded-full", i === etapas.length - 1 ? "invisible" : completada && !(i === actual) ? "bg-[#2E6BA8] dark:bg-[#3B82F6]" : "bg-slate-200 dark:bg-white/10")} />
              </div>
              {/* El nombre va como contenido CSS: la insignia de la tarjeta ya lo dice en texto y la frase sr-only lo resume. */}
              <span
                data-etapa={nombreEtapa(codigo)}
                className={cn("mt-2 px-0.5 text-[11px] leading-tight before:content-[attr(data-etapa)] sm:text-xs", i === actual ? "font-semibold text-[#183153] dark:text-slate-100" : alcanzada ? "text-slate-600 dark:text-slate-300" : "text-muted-foreground")}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
