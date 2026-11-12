import { EstadoCotizacion } from '@/types/cotizacion.types'
import { mapearEstadoCotizacion } from '@/lib/formatters/codigoCotizacion'
import { cn } from '@/lib/utils/utils'

const PASOS = [
  EstadoCotizacion.BORRADOR,
  EstadoCotizacion.PENDIENTE_APROBACION,
  EstadoCotizacion.APROBADA_INTERNA,
  EstadoCotizacion.ENVIADA,
] as const

/** Borrador → Pendiente de aprobación → Aprobada por el Jefe → Enviada. */
export function IndicadorAprobacion({ estado }: { estado: string }) {
  const encontrado = PASOS.indexOf(estado as (typeof PASOS)[number])
  const actual = encontrado >= 0 ? encontrado : PASOS.length

  return (
    <nav aria-label="Paso de aprobación">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {PASOS.map((paso, i) => {
          const status = i < actual ? 'hecho' : i === actual ? 'actual' : 'pendiente'
          return (
            <li key={paso} className="flex items-center gap-2">
              {i > 0 && <span className="text-muted-foreground/50" aria-hidden="true">→</span>}
              <span
                aria-current={status === 'actual' ? 'step' : undefined}
                className={cn(
                  status === 'actual' && 'font-medium text-foreground',
                  status === 'hecho' && 'text-muted-foreground',
                  status === 'pendiente' && 'text-muted-foreground/60',
                )}
              >
                {mapearEstadoCotizacion(paso)}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
