import { useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { calcularSubtotal, formatearMoneda, mapearCondicionPago } from '@/lib/formatters/codigoCotizacion'
import { formatearFechaCorta } from '@/lib/formatters/fechaLocal'
import { crearCotizacionSchema, type CrearCotizacionFormData } from '@/lib/validators/cotizacion.schema'
import { mensajeError } from '@/lib/errores'
import { avisar } from '@/lib/avisos'
import type { CreateCotizacionRequest, UpdateCotizacionRequest } from '@/types/cotizacion.types'
import { useClientes } from '@/features/clientes-proveedores/hooks/useClientes'
import { useIgvVigente } from '@/features/configuracion/hooks/useIgv'
import { useTipoCambio } from '@/features/tipo-cambio/hooks/useTipoCambio'
import { useCrearCotizacion } from '../hooks/useCrearCotizacion'
import { useActualizarCotizacion } from '../hooks/useActualizarCotizacion'
import { CotizacionForm } from './CotizacionForm'
import { CotizacionDetalleForm } from './CotizacionDetalleForm'
import { ConfirmarCotizacionModal } from './ConfirmarCotizacionModal'
import { CotizacionCreadaModal } from './CotizacionCreadaModal'

interface Props {
  modo: 'crear' | 'editar'
  valoresIniciales: CrearCotizacionFormData
  /** En edición la moneda no se toca. Ver el comentario de CotizacionForm. */
  monedaBloqueada?: boolean
  /** Tipo de cambio ya guardado en la cotización. null si nunca se guardó. */
  tipoCambioGuardado?: number | null
  idCotizacion?: number
}

/** Alta y edición comparten el formulario, el resumen y la confirmación. */
export function FormularioCotizacion({ modo, valoresIniciales, monedaBloqueada = false, tipoCambioGuardado = null, idCotizacion }: Props) {
  const navigate = useNavigate()
  const { data: clientes = [], isLoading: cargandoClientes } = useClientes({})
  const methods = useForm<CrearCotizacionFormData>({
    resolver: zodResolver(crearCotizacionSchema),
    mode: 'onTouched',
    defaultValues: valoresIniciales,
  })
  const [porConfirmar, setPorConfirmar] = useState<CrearCotizacionFormData | null>(null)
  const [creada, setCreada] = useState<{ id: number; codigo: string } | null>(null)

  const crear = useCrearCotizacion()
  const actualizar = useActualizarCotizacion(idCotizacion ?? 0)
  const mutacion = modo === 'editar' ? actualizar : crear
  const { porcentaje: porcentajeIgv } = useIgvVigente()

  const [clienteId, moneda, condicionPago, detalles] = useWatch({
    control: methods.control,
    name: ['clienteId', 'moneda', 'condicionPago', 'detalles'],
  })
  const monedaActual = moneda || 'PEN'
  // Alta: una sola consulta del día. Borrador: el guardado; si no viene, no se pide otro.
  const dia = useTipoCambio(modo === 'crear')
  const cambioModal = modo === 'editar'
    ? (tipoCambioGuardado != null && tipoCambioGuardado > 0 ? tipoCambioGuardado : null)
    : (dia.data != null && dia.data.valor > 0 ? dia.data.valor : null)
  const subtotal = (detalles ?? []).reduce((s, d) => s + calcularSubtotal(d?.cantidad || 0, d?.precioUnitario || 0), 0)
  const igv = subtotal * (porcentajeIgv / 100)
  const cliente = clientes.find((c) => (c.idCliente ?? c.id) === clienteId)

  const items = detalles ?? []
  const faltantes = [
    !clienteId && 'cliente',
    !condicionPago && 'condición de pago',
    !moneda && 'moneda',
    items.length === 0 && 'al menos un ítem',
    items.some((d) => !(Number(d?.precioUnitario) > 0)) && 'precio de los ítems',
    items.some((d) => !(Number(d?.cantidad) >= 1)) && 'cantidad de los ítems',
  ].filter(Boolean) as string[]

  function cuerpoDe(data: CrearCotizacionFormData): UpdateCotizacionRequest {
    const cuerpo: UpdateCotizacionRequest = {
      ...data,
      detalles: data.detalles.map((detalle) => {
        const linea = { ...detalle }
        if (typeof linea.idSourcing !== 'number') delete linea.idSourcing
        return linea
      }),
    }
    delete cuerpo.tipoCambio
    delete cuerpo.fechaTipoCambio
    return cuerpo
  }

  const confirmar = () => {
    if (!porConfirmar) return
    mutacion.mutate(cuerpoDe(porConfirmar) as CreateCotizacionRequest, {
      onSuccess: (guardada) => {
        setPorConfirmar(null)
        if (modo === 'editar') {
          avisar('Cotización actualizada. Vuelve a solicitar la aprobación.')
          navigate(`/cotizaciones/${idCotizacion}`)
          return
        }
        avisar('Cotización registrada correctamente como borrador')
        const idNueva = (guardada.idCotizacion ?? guardada.id) as number
        setCreada({ id: idNueva, codigo: guardada.codigoCotizacion ?? `#${idNueva}` })
      },
    })
  }

  const errorModal = porConfirmar && mutacion.isError
    ? mensajeError(mutacion.error, modo === 'editar' ? 'No se pudo actualizar la cotización.' : 'No se pudo crear la cotización. Revisa los datos e inténtalo de nuevo.')
    : undefined

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo={modo === 'editar' ? 'Editar cotización' : 'Nueva cotización'}
        descripcion={modo === 'editar' ? 'Corrige el borrador devuelto. Conserva el mismo código.' : 'Completa los datos generales y agrega los ítems; se crea como borrador.'}
      />

      <FormProvider<CrearCotizacionFormData> {...methods}>
        <form onSubmit={methods.handleSubmit((data) => setPorConfirmar(data))} noValidate className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-4">
            <CotizacionForm clientes={clientes} isLoadingClientes={cargandoClientes} monedaBloqueada={monedaBloqueada} />
            <CotizacionDetalleForm moneda={monedaActual} editando={modo === 'editar'} tipoCambio={cambioModal} />
          </div>

          <aside aria-labelledby="resumen-t" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24">
            <h2 id="resumen-t" className="text-base font-semibold">Resumen</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Cliente</dt>
              <dd className="text-right">{cliente?.tercero.razonSocial ?? '—'}</dd>
              <dt className="text-muted-foreground">Pago</dt>
              <dd className="text-right">{condicionPago ? mapearCondicionPago(condicionPago) : '—'}</dd>
              <dt className="text-muted-foreground">Ítems</dt>
              <dd className="text-right tabular-nums">{detalles?.length ?? 0}</dd>
              {modo === 'editar' && tipoCambioGuardado != null && tipoCambioGuardado > 0 && (
                <>
                  <dt className="text-muted-foreground">Tipo de cambio usado</dt>
                  <dd className="text-right tabular-nums">{tipoCambioGuardado.toFixed(4)}</dd>
                </>
              )}
            </dl>
            {modo === 'crear' && dia.data != null && dia.data.valor > 0 && (
              <p className="text-sm tabular-nums">
                Tipo de cambio propuesto: {dia.data.valor.toFixed(4)} del {formatearFechaCorta(dia.data.fecha)}
              </p>
            )}
            {modo === 'crear' && dia.data && !dia.data.esDeHoy && (
              <p role="status" className="text-xs text-muted-foreground">
                Hoy aún no hay tipo de cambio; se usa el último guardado del {formatearFechaCorta(dia.data.fecha)}.
              </p>
            )}
            <dl className="grid grid-cols-[1fr_auto] gap-y-2 border-t border-border pt-4 text-sm">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="text-right tabular-nums">{formatearMoneda(subtotal, monedaActual)}</dd>
              <dt className="text-muted-foreground">IGV ({porcentajeIgv.toLocaleString('es-PE', { maximumFractionDigits: 2 })}%)</dt>
              <dd className="text-right tabular-nums">{formatearMoneda(igv, monedaActual)}</dd>
              <dt className="text-base font-semibold">Total</dt>
              <dd className="text-right text-base font-semibold tabular-nums">{formatearMoneda(subtotal + igv, monedaActual)}</dd>
            </dl>

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={mutacion.isPending || faltantes.length > 0} aria-describedby={faltantes.length ? 'cot-faltantes' : undefined} className="w-full">
                {mutacion.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                {modo === 'editar' ? 'Revisar y guardar' : 'Revisar y crear'}
              </Button>
              {faltantes.length > 0 && (
                <p id="cot-faltantes" className="text-center text-xs text-muted-foreground">
                  Falta: {faltantes.join(', ')}.
                </p>
              )}
              <Button variant="ghost" asChild className="w-full">
                <Link to={modo === 'editar' ? `/cotizaciones/${idCotizacion}` : '/cotizaciones'}>Cancelar</Link>
              </Button>
            </div>
          </aside>
        </form>
      </FormProvider>

      {porConfirmar && (
        <ConfirmarCotizacionModal
          cliente={cliente?.tercero.razonSocial ?? '—'}
          condicion={porConfirmar.condicionPago ? mapearCondicionPago(porConfirmar.condicionPago) : '—'}
          moneda={porConfirmar.moneda}
          observaciones={porConfirmar.observaciones}
          items={porConfirmar.detalles.map((d) => ({
            producto: d.producto,
            cantidad: d.cantidad,
            precioUnitario: d.precioUnitario,
            subtotal: calcularSubtotal(d.cantidad || 0, d.precioUnitario || 0),
          }))}
          subtotal={subtotal}
          igv={igv}
          porcentajeIgv={porcentajeIgv}
          isPending={mutacion.isPending}
          error={errorModal}
          titulo={modo === 'editar' ? 'Revisa la cotización antes de guardarla' : undefined}
          descripcion={modo === 'editar' ? 'Se actualiza el mismo borrador. Después hay que volver a solicitar la aprobación.' : undefined}
          textoConfirmar={modo === 'editar' ? 'Confirmar y guardar' : undefined}
          onConfirmar={confirmar}
          onVolver={() => setPorConfirmar(null)}
        />
      )}

      {creada && (
        <CotizacionCreadaModal
          id={creada.id}
          codigo={creada.codigo}
          onVer={() => navigate(`/cotizaciones/${creada.id}`)}
          onOtra={() => {
            methods.reset(valoresIniciales)
            setCreada(null)
          }}
        />
      )}
    </div>
  )
}
