import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PanelLateral } from '@/components/ui/PanelLateral'
import { Button } from '@/components/ui/button'
import { Campo, LeyendaObligatorio } from '@/components/ui/campo'
import { describedBy, inputFormClass, textareaFormClass } from '@/components/ui/campoEstilos'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { ClienteBuscador } from '@/features/cotizaciones/components/ClienteBuscador'
import { useClientes } from '@/features/clientes-proveedores/hooks/useClientes'
import { useOrdenesCompra } from '@/features/ordenes-compra/hooks/useOrdenesCompra'
import { mensajeErrorApi } from '@/api/productosApi'
import { avisar } from '@/lib/avisos'
import { PRIORIDADES_RECLAMO, TIPOS_RECLAMO } from '@/lib/formatters/estados'
import { reclamoSchema, type ReclamoFormValues } from '@/lib/validators/reclamo.schema'
import type { Reclamo } from '@/types/reclamo.types'
import { useGuardarReclamo, useResponsablesReclamo } from '../hooks/useReclamos'

interface Props {
  abierto: boolean
  onCerrar: () => void
  /** Si viene, se edita; si no, se registra uno nuevo. */
  reclamo?: Reclamo
  onGuardado?: (reclamo: Reclamo) => void
}

const aNumero = (v: unknown) => (v === '' || v == null ? undefined : Number(v))

function valoresDe(r?: Reclamo): ReclamoFormValues {
  return {
    tipo: r?.tipo ?? 'RECLAMO',
    prioridad: r?.prioridad ?? 'MEDIA',
    idCliente: r?.idCliente ?? undefined,
    idOrdenCompra: r?.idOrdenCompra ?? undefined,
    idUsuarioResponsable: r?.idUsuarioResponsable ?? undefined,
    asunto: r?.asunto ?? '',
    descripcion: r?.descripcion ?? '',
    fechaLimite: r?.fechaLimite ?? '',
  }
}

/** Panel lateral para registrar o editar un reclamo/incidencia. */
export function ReclamoFormPanel({ abierto, onCerrar, reclamo, onGuardado }: Props) {
  const editando = !!reclamo
  const [error, setError] = useState<string | null>(null)
  const guardar = useGuardarReclamo()
  const { data: clientes = [], isLoading: cargandoClientes } = useClientes({})
  const { data: ordenes } = useOrdenesCompra({ size: 200 })
  const { data: responsables = [] } = useResponsablesReclamo()

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ReclamoFormValues>({
    resolver: zodResolver(reclamoSchema),
    values: valoresDe(reclamo),
  })
  const tipo = useWatch({ control, name: 'tipo' })

  const cerrar = () => {
    setError(null)
    reset(valoresDe(reclamo))
    onCerrar()
  }

  const enviar = (v: ReclamoFormValues) => {
    setError(null)
    guardar.mutate(
      {
        id: reclamo?.idReclamo,
        data: { ...v, fechaLimite: v.fechaLimite || undefined },
      },
      {
        onSuccess: (r) => {
          avisar(editando ? `${r.codigoReclamo} actualizado` : `${r.codigoReclamo} registrado`)
          onGuardado?.(r)
          cerrar()
        },
        onError: (e) => setError(mensajeErrorApi(e, 'No se pudo guardar.')),
      },
    )
  }

  return (
    <PanelLateral
      abierto={abierto}
      onCerrar={cerrar}
      titulo={editando ? `Editar ${reclamo.codigoReclamo}` : 'Registrar reclamo o incidencia'}
      descripcion={editando ? undefined : 'Queda en estado Registrado y aparece en el seguimiento.'}
    >
      <form onSubmit={handleSubmit(enviar)} noValidate className="flex flex-col gap-4">
        <LeyendaObligatorio />
        {error && <ErrorBanner message={error} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="rec-tipo" label="Tipo" obligatorio error={errors.tipo?.message}
            ayuda={tipo === 'INCIDENCIA' ? 'Problema operativo; puede ser interno.' : 'Queja formal de un cliente.'}>
            <select id="rec-tipo" className={inputFormClass} disabled={editando} {...register('tipo')}
              aria-describedby={describedBy('rec-tipo', { error: errors.tipo, ayuda: true })}>
              {Object.entries(TIPOS_RECLAMO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Campo>
          <Campo id="rec-prioridad" label="Prioridad" obligatorio>
            <select id="rec-prioridad" className={inputFormClass} {...register('prioridad')}>
              {Object.entries(PRIORIDADES_RECLAMO).map(([v, e]) => <option key={v} value={v}>{e.label}</option>)}
            </select>
          </Campo>
        </div>

        <Campo id="rec-cliente" label="Cliente" obligatorio={tipo === 'RECLAMO'} opcional={tipo !== 'RECLAMO'}
          error={errors.idCliente?.message}>
          <Controller
            control={control}
            name="idCliente"
            render={({ field }) => (
              <ClienteBuscador
                id="rec-cliente"
                clientes={clientes}
                isLoading={cargandoClientes}
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.idCliente}
                describedBy={describedBy('rec-cliente', { error: errors.idCliente })}
              />
            )}
          />
        </Campo>

        <Campo id="rec-orden" label="Orden de compra relacionada" opcional
          ayuda="Si eliges una orden y no un cliente, se toma el cliente de la orden.">
          <select id="rec-orden" className={inputFormClass}
            {...register('idOrdenCompra', { setValueAs: aNumero })}
            aria-describedby={describedBy('rec-orden', { ayuda: true })}>
            <option value="">Sin orden de compra</option>
            {(ordenes?.content ?? []).map((o) => (
              <option key={o.idOrdenCompra} value={o.idOrdenCompra}>
                {o.numeroOrdenCompra} — {o.cliente ?? o.clienteNombre ?? ''}
              </option>
            ))}
          </select>
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="rec-responsable" label="Responsable" opcional>
            <select id="rec-responsable" className={inputFormClass}
              {...register('idUsuarioResponsable', { setValueAs: aNumero })}>
              <option value="">Sin asignar</option>
              {responsables.map((u) => <option key={u.idUsuario} value={u.idUsuario}>{u.nombres}</option>)}
            </select>
          </Campo>
          <Campo id="rec-limite" label="Fecha límite" opcional>
            <input id="rec-limite" type="date" className={inputFormClass} {...register('fechaLimite')} />
          </Campo>
        </div>

        <Campo id="rec-asunto" label="Asunto" obligatorio error={errors.asunto?.message}>
          <input id="rec-asunto" className={inputFormClass} maxLength={200} {...register('asunto')}
            aria-invalid={!!errors.asunto} aria-describedby={describedBy('rec-asunto', { error: errors.asunto })} />
        </Campo>

        <Campo id="rec-descripcion" label="Descripción" obligatorio error={errors.descripcion?.message}>
          <textarea id="rec-descripcion" rows={5} className={textareaFormClass} {...register('descripcion')}
            aria-invalid={!!errors.descripcion}
            aria-describedby={describedBy('rec-descripcion', { error: errors.descripcion })} />
        </Campo>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={cerrar} disabled={guardar.isPending}>Cancelar</Button>
          <Button type="submit" disabled={guardar.isPending}>
            {guardar.isPending ? 'Guardando…' : editando ? 'Guardar cambios' : 'Registrar'}
          </Button>
        </div>
      </form>
    </PanelLateral>
  )
}
