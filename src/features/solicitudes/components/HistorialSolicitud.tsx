import type { EventoSolicitud } from '@/api/contratos/solicitudes'
import { formatearFechaHora } from '@/lib/formatters/codigoCotizacion'
import { cn } from '@/lib/utils/utils'

/** Historial de una solicitud, del más reciente al más antiguo. No es un componente genérico. */
export function HistorialSolicitud({ eventos }: { eventos: EventoSolicitud[] }) {
  const ordenados = [...eventos].sort((a, b) => b.fecha.localeCompare(a.fecha))

  return (
    <section aria-labelledby="historial-solicitud" className="rounded-xl border border-border bg-card p-5">
      <h2 id="historial-solicitud" className="mb-4 text-base font-semibold text-foreground">Historial</h2>
      {ordenados.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin movimientos todavía.</p>
      ) : (
        <ol className="flex flex-col">
          {ordenados.map((evento, i) => {
            const ultimo = i === ordenados.length - 1
            return (
              <li key={`${evento.fecha}-${evento.tipo}-${i}`} className="grid grid-cols-[20px_1fr] gap-3">
                <div className="flex flex-col items-center">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                  {!ultimo && <span className="w-px flex-1 bg-border" aria-hidden="true" />}
                </div>
                <div className={cn('min-w-0', !ultimo && 'pb-4')}>
                  <p className="text-sm font-medium text-foreground">{evento.tipo}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {formatearFechaHora(evento.fecha)}
                    {evento.usuario ? ` · ${evento.usuario}` : ''}
                  </p>
                  {evento.detalle && <p className="mt-1 text-[13px] text-foreground">{evento.detalle}</p>}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
