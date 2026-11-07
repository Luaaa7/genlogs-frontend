import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Ban, FileText, Loader2, MoreHorizontal, Upload, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

const ANCHO_MENU = 232

interface Props {
  codigo: string
  urlDocumento?: string | null
  subiendo: boolean
  puedePagar: boolean
  puedeAnular: boolean
  onSubir: (archivo: File) => void
  onPagar: () => void
  onAnular: () => void
}

/**
 * Menú "⋯" con las acciones menos usadas de un comprobante (ver o subir el
 * documento de SUNAT, registrar pago, anular). Así la fila solo muestra Enviar
 * y Descargar y la tabla no queda tan ancha. Va en un portal porque la tabla
 * recorta lo que sobresale.
 */
export function MasAccionesFactura({ codigo, urlDocumento, subiendo, puedePagar, puedeAnular, onSubir, onPagar, onAnular }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [posicion, setPosicion] = useState<{ top: number; left: number } | null>(null)
  const botonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const archivoRef = useRef<HTMLInputElement>(null)

  const cerrar = useCallback(() => setAbierto(false), [])

  useLayoutEffect(() => {
    if (!abierto || !botonRef.current) return
    const r = botonRef.current.getBoundingClientRect()
    const alto = menuRef.current?.offsetHeight ?? 180
    const abajo = r.bottom + 6 + alto <= window.innerHeight
    setPosicion({
      top: abajo ? r.bottom + 6 : r.top - 6 - alto,
      left: Math.max(8, Math.min(r.right - ANCHO_MENU, window.innerWidth - ANCHO_MENU - 8)),
    })
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus()
    const fuera = (e: MouseEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !botonRef.current?.contains(t)) cerrar()
    }
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cerrar()
        botonRef.current?.focus()
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [])]
        const i = items.indexOf(document.activeElement as HTMLElement)
        const sig = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length
        items[sig]?.focus()
      }
    }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', tecla)
    window.addEventListener('scroll', cerrar, true)
    window.addEventListener('resize', cerrar)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', tecla)
      window.removeEventListener('scroll', cerrar, true)
      window.removeEventListener('resize', cerrar)
    }
  }, [abierto, cerrar])

  const item =
    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none'

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={`Más acciones de ${codigo}`}
        title="Más acciones"
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          abierto && 'bg-muted text-foreground',
        )}
      >
        {subiendo ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <MoreHorizontal className="h-4 w-4" aria-hidden="true" />}
      </button>

      <input
        ref={archivoRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const archivo = e.target.files?.[0]
          if (archivo) onSubir(archivo)
          e.target.value = ''
        }}
      />

      {abierto &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Acciones de ${codigo}`}
            style={{ top: posicion?.top ?? -9999, left: posicion?.left ?? -9999, width: ANCHO_MENU }}
            className="fixed z-[90] rounded-lg border border-border bg-card p-1 shadow-lg animate-in fade-in-0 zoom-in-95 duration-150 motion-reduce:animate-none"
          >
            {urlDocumento && (
              <a role="menuitem" href={urlDocumento} target="_blank" rel="noreferrer" onClick={cerrar} className={item}>
                <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Ver documento de SUNAT
              </a>
            )}
            <button
              type="button"
              role="menuitem"
              disabled={subiendo}
              onClick={() => {
                cerrar()
                archivoRef.current?.click()
              }}
              className={item}
            >
              <Upload className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {urlDocumento ? 'Reemplazar documento de SUNAT' : 'Subir documento de SUNAT'}
            </button>
            {puedePagar && (
              <button type="button" role="menuitem" onClick={() => { cerrar(); onPagar() }} className={item}>
                <Wallet className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Registrar pago
              </button>
            )}
            {puedeAnular && (
              <>
                <div className="my-1 border-t border-border" role="separator" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { cerrar(); onAnular() }}
                  className={cn(item, 'text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10')}
                >
                  <Ban className="h-4 w-4" aria-hidden="true" />
                  Anular comprobante
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}