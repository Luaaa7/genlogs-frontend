import { useEffect, useRef, useState } from 'react'
import { Download, Loader2, Printer, Send, X } from 'lucide-react'
import { facturacionApi } from '@/api/facturacionApi'

interface Props {
  idFactura: number
  codigo: string
  onClose: () => void
  /** Si se pasa, aparece el botón "Enviar al cliente" (solo para quien puede enviar). */
  onEnviar?: () => void
}

const boton =
  'inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/**
 * Ventana con la vista previa del comprobante (PDF) y sus acciones:
 * descargar, imprimir y enviar al cliente. Se monta solo cuando se abre.
 */
export function VistaPreviaComprobante({ idFactura, codigo, onClose, onEnviar }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const marco = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    let actual: string | null = null
    let cancelado = false
    facturacionApi
      .descargarPdf(idFactura)
      .then((pdf) => {
        if (cancelado) return
        actual = URL.createObjectURL(pdf)
        setUrl(actual)
      })
      .catch(() => !cancelado && setError('No se pudo cargar el comprobante. Intenta de nuevo desde la lista.'))
    return () => {
      cancelado = true
      if (actual) URL.revokeObjectURL(actual)
    }
  }, [idFactura])

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onClose])

  function descargar() {
    if (!url) return
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `${codigo}.pdf`
    enlace.click()
  }

  function imprimir() {
    marco.current?.contentWindow?.focus()
    marco.current?.contentWindow?.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vista-comprobante-t"
        className="flex h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-card p-4 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 id="vista-comprobante-t" className="text-lg font-semibold text-foreground">
            Comprobante {codigo}
          </h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mt-3 min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-muted">
          {!url && !error && (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando comprobante…
            </div>
          )}
          {error && <p role="alert" className="p-4 text-sm text-destructive">{error}</p>}
          {url && <iframe ref={marco} src={url} title={`Comprobante ${codigo}`} className="h-full w-full" />}
        </div>

        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button type="button" className={boton} onClick={descargar} disabled={!url}>
            <Download className="h-4 w-4" aria-hidden="true" /> Descargar
          </button>
          <button type="button" className={boton} onClick={imprimir} disabled={!url}>
            <Printer className="h-4 w-4" aria-hidden="true" /> Imprimir
          </button>
          {onEnviar && (
            <button type="button" className={boton} onClick={onEnviar}>
              <Send className="h-4 w-4" aria-hidden="true" /> Enviar al cliente
            </button>
          )}
          <button type="button" className={`${boton} bg-accent text-accent-foreground hover:bg-accent/90`} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
