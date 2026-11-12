import { Button } from '@/components/ui/button'
import { mensajeError } from '@/lib/errores'
import { usePermisos } from '@/lib/permisos'
import type { Despacho } from '../api/despachoTipos'
import { useAccionesDespacho } from '../hooks/useDespachos'

/** Avanzar y dar salida: asistente logístico. Pase y SCTR: supervisor SST. */
export function AccionesDespacho({ despacho }: { despacho: Despacho }) {
  const permisos = usePermisos()
  const logistico = permisos.puedeCrear('despacho')
  const sst = permisos.puedeAprobar('despacho')
  const acciones = useAccionesDespacho(despacho.id)
  const bloqueado = despacho.bloqueoSst !== null
  const error = acciones.avanzar.error ?? acciones.salida.error ?? acciones.pase.error ?? acciones.sctr.error
  const ocupado = acciones.avanzar.isPending || acciones.salida.isPending || acciones.pase.isPending || acciones.sctr.isPending

  if (!logistico && !sst && !error) return null

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap gap-2">
        {logistico && (
          <>
            <Button type="button" onClick={() => acciones.avanzar.mutate()} disabled={bloqueado || ocupado}>Avanzar</Button>
            <Button type="button" variant="outline" onClick={() => acciones.salida.mutate()} disabled={bloqueado || ocupado}>Dar salida</Button>
          </>
        )}
        {sst && (
          <>
            <Button type="button" onClick={() => acciones.pase.mutate()} disabled={ocupado}>Confirmar pase</Button>
            <Button type="button" variant="outline" onClick={() => acciones.sctr.mutate()} disabled={ocupado}>Confirmar SCTR</Button>
          </>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{mensajeError(error)}</p>}
    </div>
  )
}
