import { Check, X } from 'lucide-react'
import { Ventana } from '@/components/ui/Ventana'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/utils'
import { ESTADOS_ORDEN, estadoDe } from '@/lib/formatters/estados'
import { formatearFechaHora } from '@/lib/formatters/codigoCotizacion'
import type { SeguimientoOrdenCompra } from '@/types/ordenCompra.types'
import { useSeguimientoOrdenCompra } from '../hooks/useOrdenesCompra'

function tituloDe(s: SeguimientoOrdenCompra): string {
  switch (s.tipoEvento) {
    case 'CAMBIO_ESTADO':
      return `${s.estadoAnterior ? `${estadoDe(ESTADOS_ORDEN, s.estadoAnterior).label} → ` : ''}${estadoDe(ESTADOS_ORDEN, s.estadoNuevo).label}`
    case 'ARCHIVO_OC':
      return 'PDF de la OC subido'
    case 'OC_CLIENTE':
      return 'OC del cliente registrada'
    default:
      return 'Orden registrada'
  }
}

/** Historial de una orden de compra, del más reciente al más antiguo. */
export function SeguimientoOrdenPanel({ idOrden, numero, onCerrar }: { idOrden: number; numero: string; onCerrar: () => void }) {
  const { data, isLoading, isError } = useSeguimientoOrdenCompra(idOrden)
  const eventos = data ?? []

  return (
    <Ventana
      titulo="Seguimiento"
      descripcion={`Orden interna ${numero}`}
      onCerrar={onCerrar}
      acciones={<Button type="button" variant="ghost" onClick={onCerrar}>Cerrar</Button>}
    >
      {isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">Cargando el seguimiento…</p>
      ) : isError ? (
        <p role="alert" className="text-sm text-destructive">No se pudo cargar el seguimiento de la orden.</p>
      ) : eventos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin eventos todavía.</p>
      ) : (
        <ol className="flex flex-col">
          {eventos.map((s, i) => {
            const negativo = s.tipoEvento === 'CAMBIO_ESTADO' && s.estadoNuevo === 'ANULADA'
            const ultimo = i === eventos.length - 1
            return (
              <li key={s.idSeguimiento} className="grid grid-cols-[20px_1fr] gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                      negativo ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success',
                    )}
                    aria-hidden="true"
                  >
                    {negativo ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                  </span>
                  {!ultimo && <span className="w-px flex-1 bg-border" aria-hidden="true" />}
                </div>
                <div className={cn('min-w-0', !ultimo && 'pb-5')}>
                  <p className="text-sm font-medium text-foreground">{tituloDe(s)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatearFechaHora(s.fechaEvento)}
                    {s.usuario ? ` · ${s.usuario}` : ''}
                  </p>
                  {s.comentario && <p className="mt-1 text-sm text-foreground">{s.comentario}</p>}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Ventana>
  )
}