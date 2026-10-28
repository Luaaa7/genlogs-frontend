import React, { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { useCrearOrdenCompra } from '../hooks/useOrdenesCompra'

interface RegistrarOrdenCompraModalProps {
  isOpen: boolean
  onClose: () => void
  idCotizacion: number
  idCondicionPago: number
  codigoCotizacion?: string
  onCreada?: () => void
}

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
  const [numero, setNumero] = useState('')
  const [fecha, setFecha] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

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
    setError(null)
    crear(
      {
        idCotizacion,
        idCondicionPago,
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
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          setError(msg ?? 'No se pudo registrar la orden de compra. Inténtalo de nuevo.')
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
        {codigoCotizacion && (
          <p className="mt-3 text-sm text-muted-foreground">Sobre la cotización {codigoCotizacion}.</p>
        )}
        <form onSubmit={enviar} className="mt-4 space-y-4">
          <div>
            <label htmlFor="oc-numero" className="block text-sm font-medium text-foreground">
              Número de orden de compra del cliente <span className="text-destructive">*</span>
            </label>
            <input id="oc-numero" value={numero} onChange={(e) => setNumero(e.target.value)} className={campo} placeholder="Ej. 0017-10" />
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
            <button type="submit" disabled={isPending} className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50">
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar orden
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
