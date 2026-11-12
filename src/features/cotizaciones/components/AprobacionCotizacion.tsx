import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { EstadoCotizacion } from '@/types/cotizacion.types'
import { Button } from '@/components/ui/button'
import { Ventana } from '@/components/ui/Ventana'
import { textareaFormClass } from '@/components/ui/campoEstilos'
import { mensajeError } from '@/lib/errores'
import { useAprobacionCotizacion } from '../hooks/useAprobacionCotizacion'

const devolverSchema = z.object({
  motivo: z.string().trim().min(1, 'Indica el motivo para devolver la cotización'),
})

interface Props {
  id: number
  estado: string
  asistente: boolean
  jefe: boolean
  onEnviar: () => void
}

/** Botones del flujo de aprobación. Enviar al cliente no usa APROBADA: esa es la del cliente. */
export function AprobacionCotizacion({ id, estado, asistente, jefe, onEnviar }: Props) {
  const acciones = useAprobacionCotizacion(id)
  const [devolviendo, setDevolviendo] = useState(false)
  const error = acciones.solicitar.error ?? acciones.aprobar.error ?? acciones.devolver.error
  const ocupado = acciones.solicitar.isPending || acciones.aprobar.isPending || acciones.devolver.isPending
  const esperaEnvio = estado === EstadoCotizacion.BORRADOR || estado === EstadoCotizacion.PENDIENTE_APROBACION
  const puedeEnviar = asistente && (esperaEnvio || estado === EstadoCotizacion.APROBADA_INTERNA)
  const porqueNoEnvia = estado === EstadoCotizacion.BORRADOR
    ? 'Se envía al cliente cuando el Jefe la haya aprobado.'
    : estado === EstadoCotizacion.PENDIENTE_APROBACION
      ? 'Está pendiente de la aprobación del Jefe.'
      : null

  if (!puedeEnviar && !(jefe && estado === EstadoCotizacion.PENDIENTE_APROBACION) && !error) return null

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        {asistente && estado === EstadoCotizacion.BORRADOR && (
          <Button type="button" onClick={() => acciones.solicitar.mutate()} disabled={ocupado}>Solicitar aprobación</Button>
        )}
        {jefe && estado === EstadoCotizacion.PENDIENTE_APROBACION && (
          <>
            <Button type="button" onClick={() => acciones.aprobar.mutate()} disabled={ocupado}>Aprobar</Button>
            <Button type="button" variant="outline" onClick={() => setDevolviendo(true)} disabled={ocupado}>Devolver</Button>
          </>
        )}
        {puedeEnviar && (
          <Button type="button" onClick={onEnviar} disabled={esperaEnvio || ocupado}>
            Enviar al cliente
          </Button>
        )}
      </div>
      {asistente && porqueNoEnvia && <p className="max-w-xs text-right text-xs text-muted-foreground">{porqueNoEnvia}</p>}
      {error && <p role="alert" className="max-w-xs text-right text-sm text-destructive">{mensajeError(error)}</p>}
      {devolviendo && (
        <DevolverVentana
          ocupado={ocupado}
          onCerrar={() => setDevolviendo(false)}
          onConfirmar={(motivo) => {
            acciones.devolver.mutate(motivo, { onSuccess: () => setDevolviendo(false) })
          }}
        />
      )}
    </div>
  )
}

function DevolverVentana({ ocupado, onCerrar, onConfirmar }: { ocupado: boolean; onCerrar: () => void; onConfirmar: (motivo: string) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<{ motivo: string }>({
    resolver: zodResolver(devolverSchema),
    defaultValues: { motivo: '' },
  })
  return (
    <Ventana
      titulo="Devolver cotización"
      descripcion="El asistente la recibe de nuevo en borrador."
      onCerrar={onCerrar}
      acciones={<Button type="submit" form="devolver-cotizacion" disabled={ocupado}>Confirmar devolución</Button>}
    >
      <form id="devolver-cotizacion" onSubmit={handleSubmit((v) => onConfirmar(v.motivo))}>
        <label className="text-sm text-foreground" htmlFor="motivo-devolucion">Motivo
          <textarea id="motivo-devolucion" className={`${textareaFormClass} mt-1`} {...register('motivo')} />
        </label>
        {errors.motivo && <p role="alert" className="mt-2 text-sm text-destructive">{errors.motivo.message}</p>}
      </form>
    </Ventana>
  )
}
