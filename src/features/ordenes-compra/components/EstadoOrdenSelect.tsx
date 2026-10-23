import type { AxiosError } from 'axios'
import { useCambiarEstadoOrdenCompra } from '../hooks/useOrdenesCompra'
import { controlClass } from '@/components/ui/tabla'
import { ESTADOS_ORDEN } from '@/lib/formatters/estados'
import { cn } from '@/lib/utils'
import type { EstadoOrdenCompra } from '@/types/ordenCompra.types'

/** Estados finales: ya no se pueden cambiar (el backend también lo bloquea). */
const ESTADOS_FINALES = new Set<string>(['ATENDIDA', 'ANULADA'])

interface Props {
  idOrden: number
  estadoActual: string
  numero: string
  onError: (mensaje: string) => void
}

/** Selector para cambiar el estado de una orden de compra desde la tabla. */
export function EstadoOrdenSelect({ idOrden, estadoActual, numero, onError }: Props) {
  const { mutate, isPending } = useCambiarEstadoOrdenCompra(idOrden)

  if (ESTADOS_FINALES.has(estadoActual)) return null

  return (
    <select
      aria-label={`Cambiar estado de la orden ${numero}`}
      value=""
      disabled={isPending}
      onChange={(e) => {
        const nuevo = e.target.value as EstadoOrdenCompra
        if (!nuevo) return
        mutate(nuevo, {
          onError: (err) =>
            onError(`No se pudo cambiar el estado de la orden ${numero}. ${(err as AxiosError<{ message?: string }>).response?.data?.message ?? ''}`.trim()),
        })
      }}
      className={cn(controlClass, 'h-8 px-2 text-[13px]')}
    >
      <option value="">{isPending ? 'Guardando…' : 'Cambiar…'}</option>
      {Object.entries(ESTADOS_ORDEN)
        .filter(([codigo]) => codigo !== estadoActual)
        .map(([codigo, e]) => (
          <option key={codigo} value={codigo}>{e.label}</option>
        ))}
    </select>
  )
}