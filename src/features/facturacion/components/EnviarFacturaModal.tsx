import { useState } from 'react'
import { Loader2, Paperclip, Send, X } from 'lucide-react'
import { useEnviarFactura } from '../hooks/useFacturacion'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { avisar } from '@/lib/avisos'
import type { Factura } from '@/types/facturacion.types'

interface Props {
  factura: Factura
  codigo: string
  onClose: () => void
}

const campo =
  'mt-1 block w-full rounded-md border border-border p-2 text-sm shadow-sm focus:border-accent focus:outline-none'

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function mensajeDe(err: unknown): string {
  const data = (err as { response?: { data?: { message?: string; mensaje?: string } } })?.response?.data
  return data?.mensaje ?? data?.message ?? 'No se pudo enviar el correo. Revisa tu conexión e intenta de nuevo.'
}

/**
 * Envía el comprobante al cliente por correo con el PDF adjunto: el documento
 * de SUNAT si se subió, si no el PDF del sistema. Se monta solo cuando se abre,
 * así siempre arranca con los datos de ESA factura.
 */
export function EnviarFacturaModal({ factura, codigo, onClose }: Props) {
  const id = factura.idFacturacion ?? factura.id ?? 0
  const simulado = factura.sunatModo === 'SIMULADO'
  const { mutate, isPending } = useEnviarFactura()

  const [correo, setCorreo] = useState(factura.clienteEmail ?? '')
  const [asunto, setAsunto] = useState(`${factura.tipoComprobante === 'BOLETA' ? 'Boleta' : 'Factura'} ${codigo} - GenLogs`)
  const [mensaje, setMensaje] = useState('Estimado cliente, adjuntamos el comprobante de su compra.')
  const [incluirTotal, setIncluirTotal] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!CORREO.test(correo.trim())) return setError('Escribe un correo válido.')
    if (asunto.trim().length < 3) return setError('Escribe un asunto.')
    mutate(
      { id, data: { correoDestinatario: correo.trim(), asunto: asunto.trim(), mensaje: mensaje.trim(), incluirDetalles: incluirTotal } },
      {
        onSuccess: (r) => {
          // El backend responde 200 aunque el correo no salga: hay que mirar "success".
          if (r?.success === false) return setError(r.mensaje || 'No se pudo enviar el correo.')
          avisar(r?.mensaje ?? `${codigo} enviado`)
          onClose()
        },
        onError: (err) => setError(mensajeDe(err)),
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="envio-factura-t" className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 id="envio-factura-t" className="text-lg font-semibold text-foreground">Enviar {codigo} al cliente</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={enviar} className="mt-4 space-y-4" noValidate>
          <div>
            <label htmlFor="ef-correo" className="block text-sm font-medium text-foreground">Correo del cliente</label>
            <input id="ef-correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className={campo} />
          </div>
          <div>
            <label htmlFor="ef-asunto" className="block text-sm font-medium text-foreground">Asunto</label>
            <input id="ef-asunto" value={asunto} onChange={(e) => setAsunto(e.target.value)} className={campo} />
          </div>
          <div>
            <label htmlFor="ef-mensaje" className="block text-sm font-medium text-foreground">Mensaje</label>
            <textarea id="ef-mensaje" rows={3} value={mensaje} onChange={(e) => setMensaje(e.target.value)} className={campo} />
          </div>

          <p className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-foreground">
            <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            {factura.urlArchivo ? 'Se adjunta el documento de SUNAT' : `Se adjunta el PDF: ${codigo}.pdf`}
          </p>
          {simulado && !factura.urlArchivo && (
            <p className="text-xs text-warning-text">Es una emisión de prueba: el PDF lleva la marca de agua “SIMULACIÓN”.</p>
          )}

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={incluirTotal} onChange={(e) => setIncluirTotal(e.target.checked)} className="h-4 w-4 rounded border-border" />
            Mostrar el total en el texto del correo
          </label>

          {error && <ErrorBanner message={error} />}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isPending} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              {isPending ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}