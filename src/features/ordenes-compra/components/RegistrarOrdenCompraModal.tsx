import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { ordenesCompraApi } from '@/api/ordenesCompraApi'
import { formatearMoneda } from '@/lib/formatters/codigoCotizacion'
import { useCrearOrdenCompra } from '../hooks/useOrdenesCompra'
import { mensajeError } from '@/lib/errores'

interface RegistrarOrdenCompraModalProps {
  isOpen: boolean
  onClose: () => void
  idCotizacion: number
  idCondicionPago: number
  codigoCotizacion?: string
  onCreada?: () => void
}

const FORMATO_OC = /^[0-9]{4}-[1-9][0-9]*0$/

const campo =
  'mt-1 block w-full rounded-md border border-border p-2 text-sm shadow-sm focus:border-accent focus:outline-none'

/** Registra la orden de compra que el cliente envió para una cotización ya aprobada. */
export const RegistrarOrdenCompraModal: React.FC<RegistrarOrdenCompraModalProps> = ({
  isOpen,
  onClose,
  idCotizacion,
  idCondicionPago,
  codigoCotizacion,
  onCreada,
}) => {
  const { mutate: crear, isPending } = useCrearOrdenCompra()
  const precarga = useQuery({
    queryKey: ['ordenes-compra', 'desde-cotizacion', idCotizacion],
    queryFn: () => ordenesCompraApi.precargarDesdeCotizacion(idCotizacion),
    enabled: isOpen && idCotizacion > 0,
    retry: false,
  })
  const [numero, setNumero] = useState('')
  const [fecha, setFecha] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const datos = precarga.data
  const condicion = datos?.idCondicionPago ?? idCondicionPago
  const codigoOrigen = datos?.codigoCotizacion || codigoCotizacion
  const lista = !precarga.isLoading && !precarga.isError

  const cerrar = () => {
    setError(null)
    onClose()
  }

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!numero.trim()) {
      setError('Escribe el número de la orden de compra del cliente.')
      return
    }
    if (!FORMATO_OC.test(numero.trim())) {
      setError('El número debe tener el formato 0107-10: cuatro dígitos, un guion y un sufijo que termine en 0 (10, 20, 30…).')
      return
    }
    if (!datos) {
      setError(precarga.isError
        ? mensajeError(precarga.error, 'No se pudieron cargar los datos de la cotización.')
        : 'Espera a que carguen los datos de la cotización.')
      return
    }
    setError(null)
    crear(
      {
        idCotizacion,
        idCondicionPago: condicion,
        numeroOrdenCompra: numero.trim(),
        fechaEmisionCliente: fecha || undefined,
        observaciones: observaciones.trim() || undefined,
      },
      {
        onSuccess: () => {
          setNumero('')
          setFecha('')
          setObservaciones('')
          onCreada?.()
          onClose()
        },
        onError: (err) => {
          setError(mensajeError(err, 'No se pudo registrar la orden de compra. Inténtalo de nuevo.'))
        },
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-semibold text-foreground">Registrar orden de compra</h3>
          <button type="button" onClick={cerrar} className="text-muted-foreground hover:text-foreground" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        {codigoOrigen && (
          <p className="mt-3 text-sm text-foreground">Cotización de origen {codigoOrigen}.</p>
        )}
        {precarga.isLoading && (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando los datos de la cotización…
          </p>
        )}
        {precarga.isError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {mensajeError(precarga.error, 'No se pudieron cargar los datos de la cotización.')}
          </p>
        )}
        {datos && (
          <div className="mt-3 space-y-2 text-sm">
            <p><span className="text-muted-foreground">Cliente: </span>{datos.cliente || 'Sin cliente'}</p>
            <p><span className="text-muted-foreground">Moneda: </span><span>PEN</span></p>
            {(datos.items ?? []).length === 0 ? (
              <p className="text-muted-foreground">La cotización no tiene ítems.</p>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {(datos.items ?? []).map((item, i) => (
                  <li key={item.idCotizacionDetalle ?? i} className="flex items-baseline justify-between gap-3 px-3 py-2">
                    <span className="min-w-0">
                      {item.descripcion}
                      <span className="text-muted-foreground"> · {item.cantidad}{item.unidad ? ` ${item.unidad}` : ''}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">{formatearMoneda(Number(item.importe), 'PEN')}</span>
                  </li>
                ))}
              </ul>
            )}
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatearMoneda(Number(datos.subtotal), 'PEN')}</dd>
              <dt className="text-muted-foreground">IGV</dt>
              <dd className="tabular-nums">{formatearMoneda(Number(datos.igv), 'PEN')}</dd>
              <dt className="font-medium">Total</dt>
              <dd className="font-medium tabular-nums">{formatearMoneda(Number(datos.total), 'PEN')}</dd>
            </dl>
          </div>
        )}
        <form onSubmit={enviar} className="mt-4 space-y-4">
          <div>
            <label htmlFor="oc-numero" className="block text-sm font-medium text-foreground">
              Número de orden de compra del cliente <span className="text-destructive">*</span>
            </label>
            <input id="oc-numero" value={numero} onChange={(e) => setNumero(e.target.value)} className={campo} placeholder="Ej. 0107-10" aria-describedby="oc-numero-ayuda" />
            <p id="oc-numero-ayuda" className="mt-1 text-xs text-muted-foreground">
              Formato: cuatro dígitos, guion y sufijo de 10 en 10 (0107-10, 0107-20…).
            </p>
          </div>
          <div>
            <label htmlFor="oc-fecha" className="block text-sm font-medium text-foreground">
              Fecha de emisión del cliente <span className="text-muted-foreground">(opcional)</span>
            </label>
            <input id="oc-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={campo} />
          </div>
          <div>
            <label htmlFor="oc-obs" className="block text-sm font-medium text-foreground">
              Observaciones <span className="text-muted-foreground">(opcional)</span>
            </label>
            <textarea id="oc-obs" rows={3} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className={campo} />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={cerrar} disabled={isPending} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
              Cancelar
            </button>
            <button type="submit" disabled={isPending || !lista} className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar orden
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
