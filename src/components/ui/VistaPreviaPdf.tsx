import { useEffect, useRef, useState } from 'react'
import { Download, Loader2, Printer, Send, X } from 'lucide-react'

interface Props {
  /** Título de la ventana, p. ej. "Cotización 20261028-04ADM". */
  titulo: string
  /** Nombre del archivo al descargar (sin .pdf). */
  nombreArchivo: string
  /** Pide el PDF al servidor. */
  cargar?: () => Promise<Blob>
  /** Alternativa a `cargar`: un archivo que ya está en internet (p. ej. la orden subida por el cliente). */
  urlDirecta?: string
  /** Con `urlDirecta`: si el archivo es una imagen (JPG/PNG) en vez de un PDF. */
  esImagen?: boolean
  onClose: () => void
  /** Línea bajo el título, p. ej. el N.º de OC de la minera. */
  nota?: string | null
  /** Si se pasa, aparece el botón "Enviar al cliente" (solo para quien puede enviar). */
  onEnviar?: () => void
}

const boton =
  'inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/**
 * Ventana con la vista previa de un PDF (comprobante, cotización…) y sus acciones:
 * descargar, imprimir y, si se pide, enviar al cliente. Se monta solo cuando se abre.
 */
export function VistaPreviaPdf({ titulo, nombreArchivo, cargar, urlDirecta, esImagen = false, onClose, nota, onEnviar }: Props) {
  const [url, setUrl] = useState<string | null>(urlDirecta ?? null)
  const [error, setError] = useState<string | null>(null)
  const marco = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (urlDirecta || !cargar) return
    let actual: string | null = null
    let cancelado = false
    cargar()
      .then((pdf) => {
        if (cancelado) return
        actual = URL.createObjectURL(pdf)
        setUrl(actual)
      })
      .catch(() => !cancelado && setError('No se pudo cargar el documento. Intenta de nuevo desde la lista.'))
    return () => {
      cancelado = true
      if (actual) URL.revokeObjectURL(actual)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombreArchivo])

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [onClose])

  function descargar() {
    if (!url) return
    // Un archivo de otro sitio no se puede forzar a descargar desde aquí: se abre aparte.
    if (urlDirecta) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `${nombreArchivo}.pdf`
    enlace.click()
  }

  function imprimir() {
    try {
      if (urlDirecta && esImagen) throw new Error('imagen')
      marco.current?.contentWindow?.focus()
      marco.current?.contentWindow?.print()
    } catch {
      // Archivo de otro sitio (o imagen): se abre en una pestaña para imprimirlo desde ahí.
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vista-pdf-t"
        className="flex h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-card p-4 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="min-w-0">
            <h3 id="vista-pdf-t" className="text-lg font-semibold text-foreground">
              {titulo}
            </h3>
            {nota && <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">{nota}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mt-3 min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-muted">
          {!url && !error && (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando documento…
            </div>
          )}
          {error && <p role="alert" className="p-4 text-sm text-destructive">{error}</p>}
          {url && esImagen && <img src={url} alt={titulo} className="h-full w-full object-contain" />}
          {url && !esImagen && <iframe ref={marco} src={url} title={titulo} className="h-full w-full" />}
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
