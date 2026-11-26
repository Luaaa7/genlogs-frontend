import type { LucideIcon } from "lucide-react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils/utils"

interface Props {
  /** Nombres de las etapas, en orden. */
  etapas: string[]
  /** Índice de la etapa actual (0 = primera). */
  actual: number
  /** true si la etapa actual ya es la final y está cumplida (se dibuja con check, no «en curso»). */
  terminado?: boolean
  /** Icono del círculo de la etapa en curso (camión en despachos, reloj en reclamos…). */
  IconoEnCurso: LucideIcon
  /** Frase para lectores de pantalla, p. ej. «Etapa 2 de 4: En proceso». */
  resumen: string
  className?: string
}

/**
 * Línea de etapas del portal (despachos, reclamos): círculos, check en lo cumplido y la etapa en curso en
 * amarillo. Es un dibujo sin listas, para no mezclarse con las tarjetas; los nombres van como contenido CSS
 * para no repetir el texto de la insignia de la tarjeta, y los lectores de pantalla reciben `resumen`.
 */
export function LineaEtapas({ etapas, actual, terminado = false, IconoEnCurso, resumen, className }: Props) {
  return (
    <div className={className}>
      <p className="sr-only">{resumen}</p>
      <div aria-hidden="true" className="grid" style={{ gridTemplateColumns: `repeat(${etapas.length}, minmax(0, 1fr))` }}>
        {etapas.map((nombre, i) => {
          const completada = i < actual || (terminado && i === actual)
          const enCurso = i === actual && !terminado
          const alcanzada = completada || enCurso
          return (
            <div key={nombre} className="flex min-w-0 flex-col items-center text-center">
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
                  {enCurso && <IconoEnCurso className="h-3.5 w-3.5" />}
                </span>
                <span className={cn("h-1 flex-1 rounded-full", i === etapas.length - 1 ? "invisible" : i < actual ? "bg-[#2E6BA8] dark:bg-[#3B82F6]" : "bg-slate-200 dark:bg-white/10")} />
              </div>
              <span
                data-etapa={nombre}
                className={cn("mt-2 px-0.5 text-[11px] leading-tight before:content-[attr(data-etapa)] sm:text-xs", i === actual ? "font-semibold text-[#183153] dark:text-slate-100" : alcanzada ? "text-slate-600 dark:text-slate-300" : "text-muted-foreground")}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
