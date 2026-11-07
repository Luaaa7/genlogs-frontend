import { useState } from 'react'
import { Ventana } from '@/components/ui/Ventana'
import { Button } from '@/components/ui/button'
import { Campo } from '@/components/ui/campo'
import { describedBy, textareaFormClass } from '@/components/ui/campoEstilos'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { mensajeErrorApi } from '@/api/productosApi'
import { avisar } from '@/lib/avisos'
import { ESTADOS_RECLAMO, estadoDe } from '@/lib/formatters/estados'
import type { EstadoReclamo, Reclamo } from '@/types/reclamo.types'
import { useCambiarEstadoReclamo } from '../hooks/useReclamos'

interface Props {
  reclamo: Reclamo
  nuevoEstado: EstadoReclamo
  onCerrar: () => void
}

const TEXTOS: Partial<Record<EstadoReclamo, { label: string; ayuda: string; obligatorio: boolean }>> = {
  RESUELTO: { label: 'Solución aplicada', ayuda: 'Queda registrada como la solución del caso.', obligatorio: true },
  ANULADO: { label: 'Motivo de la anulación', ayuda: 'Un registro anulado ya no se puede reabrir.', obligatorio: true },
  CERRADO: { label: 'Comentario', ayuda: 'Un registro cerrado ya no se puede editar.', obligatorio: false },
}

/** Confirma el cambio de estado y pide el comentario (obligatorio para Resuelto y Anulado). */
export function CambiarEstadoReclamoModal({ reclamo, nuevoEstado, onCerrar }: Props) {
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState<string | null>(null)
  const cambiar = useCambiarEstadoReclamo(reclamo.idReclamo)
  const texto = TEXTOS[nuevoEstado] ?? { label: 'Comentario', ayuda: 'Se agrega al seguimiento.', obligatorio: false }
  const etiqueta = estadoDe(ESTADOS_RECLAMO, nuevoEstado).label
  const faltaComentario = texto.obligatorio && comentario.trim() === ''
  const reabrir = reclamo.estado === 'RESUELTO' && nuevoEstado === 'EN_PROCESO'

  const confirmar = () => {
    if (faltaComentario) {
      setError(`Completa: ${texto.label.toLowerCase()}.`)
      return
    }
    setError(null)
    cambiar.mutate(
      { estado: nuevoEstado, comentario: comentario.trim() || undefined },
      {
        onSuccess: (r) => {
          avisar(`${r.codigoReclamo}: ${etiqueta.toLowerCase()}`)
          onCerrar()
        },
        onError: (e) => setError(mensajeErrorApi(e, 'No se pudo cambiar el estado.')),
      },
    )
  }

  return (
    <Ventana
      titulo={reabrir ? `Reabrir ${reclamo.codigoReclamo}` : `Marcar ${reclamo.codigoReclamo} como ${etiqueta.toLowerCase()}`}
      descripcion={reclamo.asunto}
      onCerrar={onCerrar}
      cerrable={!cambiar.isPending}
      acciones={
        <>
          <Button variant="outline" onClick={onCerrar} disabled={cambiar.isPending}>Cancelar</Button>
          <Button variant={nuevoEstado === 'ANULADO' ? 'destructive' : 'default'} onClick={confirmar} disabled={cambiar.isPending}>
            {cambiar.isPending ? 'Guardando…' : reabrir ? 'Reabrir' : `Marcar como ${etiqueta.toLowerCase()}`}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}
        <Campo id="estado-comentario" label={texto.label} ayuda={texto.ayuda}
          obligatorio={texto.obligatorio} opcional={!texto.obligatorio}>
          <textarea
            id="estado-comentario"
            rows={4}
            className={textareaFormClass}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            aria-describedby={describedBy('estado-comentario', { ayuda: true })}
          />
        </Campo>
      </div>
    </Ventana>
  )
}
