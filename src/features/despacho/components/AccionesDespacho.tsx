import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { inputFormClass } from '@/components/ui/campoEstilos'
import { mensajeError } from '@/lib/errores'
import { usePermisos } from '@/lib/permisos'
import { nombreEtapa, siguienteEtapa, type Despacho, type TipoSst } from '../api/despachoTipos'
import { useAvanzarDespacho, useConfirmarSst } from '../hooks/useDespachos'

/** Avanzar: asistente logístico. Pase y SCTR: supervisor SST. */
export function AccionesDespacho({ despacho }: { despacho: Despacho }) {
  const permisos = usePermisos()
  const logistico = permisos.puedeCrear('despacho')
  const supervisor = permisos.puedeAprobar('despacho')
  const siguiente = siguienteEtapa(despacho.etapa, despacho.origen)
  const avanzar = useAvanzarDespacho(despacho.idDespacho)
  const confirmar = useConfirmarSst(despacho.idDespacho, siguiente, logistico)
  const bloqueado = despacho.sst?.bloqueaAvance === true
  const [tipo, setTipo] = useState<TipoSst>('PASE')
  const [vencimiento, setVencimiento] = useState('')
  const error = avanzar.error ?? confirmar.error

  if (!logistico && !supervisor && !error) return null

  return (
    <div className="flex flex-col items-start gap-3">
      {despacho.sst?.mensaje && (
        <p role="alert" className="text-sm text-warning-text">{despacho.sst.mensaje}</p>
      )}
      {logistico && siguiente && (
        <Button type="button" onClick={() => avanzar.mutate(siguiente)} disabled={bloqueado || avanzar.isPending || confirmar.isPending}>
          Avanzar a {nombreEtapa(siguiente)}
        </Button>
      )}
      {supervisor && (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!vencimiento) return
            confirmar.mutate({ tipo, fechaVencimiento: vencimiento })
          }}
        >
          <label className="block text-sm font-medium text-foreground">
            Documento
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoSst)} className={`${inputFormClass} mt-1`}>
              <option value="PASE">PASE</option>
              <option value="SCTR">SCTR</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-foreground">
            Vencimiento
            <input type="date" required value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} className={`${inputFormClass} mt-1`} />
          </label>
          <Button type="submit" disabled={confirmar.isPending || vencimiento === ''}>Confirmar</Button>
        </form>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{mensajeError(error)}</p>}
    </div>
  )
}
