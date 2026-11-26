import type { ReactNode } from "react"
import { EtiquetaPortal } from "./EtiquetaPortal"
import { EscenaEncabezado, ObjetoEncabezado, type IlustracionEncabezado } from "./EscenaEncabezado"

export interface DatoResumen {
  icono: ReactNode
  /** Cifra real calculada con los datos de la página. */
  valor: number
  texto: string
}

interface EncabezadoPortalProps {
  titulo: string
  descripcion?: string
  /** Botón o enlace a la derecha (por ejemplo «Nueva solicitud»). */
  accion?: ReactNode
  /** Objeto de la sección que se dibuja sobre la cordillera (camión, comprobante…). */
  ilustracion?: IlustracionEncabezado
  /** Píldoras con totales reales bajo la descripción; sin datos no se muestran. No usa listas, para no mezclarse con las tarjetas. */
  resumen?: DatoResumen[]
}

/**
 * Encabezado del portal con el lenguaje de Repuestos: azul acero suave, retícula técnica, la cordillera de
 * GenLogs, la etiqueta dorada y, opcionalmente, la ilustración de la sección y un resumen con cifras reales.
 */
export function EncabezadoPortal({ titulo, descripcion, accion, ilustracion, resumen }: EncabezadoPortalProps) {
  return (
    <header className="relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#EEF3F8] via-[#F4F7FB] to-[#E3ECF6] px-5 py-7 shadow-sm dark:border-white/10 dark:from-[#10213B] dark:via-[#0D1C36] dark:to-[#0B1830] sm:px-8 sm:py-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-full sm:w-[70%] lg:w-[55%]">
        <EscenaEncabezado className="opacity-50 sm:opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#EEF3F8] via-[#EEF3F8]/50 to-transparent dark:from-[#10213B] dark:via-[#10213B]/50" />
      </div>
      {ilustracion && (
        // El objeto se queda a la izquierda de la acción (si la hay) y se oculta por debajo de «lg», donde taparía el texto.
        <div aria-hidden="true" className={`pointer-events-none absolute bottom-3 -z-10 hidden lg:block ${ilustracion === "despachos" ? "top-14" : "top-4"} ${accion ? "right-80" : "right-10"}`}>
          <ObjetoEncabezado ilustracion={ilustracion} />
        </div>
      )}
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 -z-10 h-64 w-64 rounded-full bg-[#2E6BA8]/10 blur-3xl dark:bg-[#2E6BA8]/25" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <EtiquetaPortal />
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#183153] dark:text-foreground sm:text-4xl">{titulo}</h1>
          {descripcion && <p className="mt-2 text-muted-foreground sm:text-lg">{descripcion}</p>}
          {resumen && resumen.length > 0 && (
            <div role="group" aria-label={`Resumen de ${titulo.toLowerCase()}`} className="mt-4 flex flex-wrap gap-2 text-sm">
              {resumen.map((d) => (
                <span key={d.texto} className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[#183153] shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  <span aria-hidden="true" className="text-[#2E6BA8] dark:text-[#60A5FA] [&>svg]:h-4 [&>svg]:w-4">{d.icono}</span>
                  <span className="font-semibold tabular-nums">{d.valor}</span> {d.texto}
                </span>
              ))}
            </div>
          )}
        </div>
        {accion}
      </div>
    </header>
  )
}
