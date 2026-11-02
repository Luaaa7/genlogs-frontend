import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/utils'

interface VentanaProps {
  titulo: string
  descripcion?: string
  onCerrar: () => void
  /** Botones de abajo (alineados a la derecha). */
  acciones?: ReactNode
  /** Ancho máximo: por defecto "max-w-lg". */
  ancho?: string
  /** Si es false, Escape y el clic fuera no la cierran (p. ej. mientras guarda). */
  cerrable?: boolean
  children: ReactNode
}

/** Ventana emergente centrada (modal) para registrar, confirmar o avisar.
 *  Va en un portal: no queda dentro del <form> de la pantalla ni lo envía. */
export function Ventana({ titulo, descripcion, onCerrar, acciones, ancho = 'max-w-lg', cerrable = true, children }: VentanaProps) {
  const ref = useRef<HTMLDivElement>(null)
  const cerrarRef = useRef(onCerrar)
  useEffect(() => {
    cerrarRef.current = onCerrar
  }, [onCerrar])

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>('input, select, textarea')?.focus() ?? ref.current?.focus()
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && cerrable) cerrarRef.current()
    }
    document.addEventListener('keydown', alTeclear)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = ''
      anterior?.focus()
    }
  }, [cerrable])

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onSubmit={(e) => e.stopPropagation()}>
      <div
        className="absolute inset-0 bg-black/40 animate-in fade-in-0 duration-200 motion-reduce:animate-none"
        onClick={() => cerrable && onCerrar()}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ventana-titulo"
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col rounded-xl border border-border bg-card shadow-xl animate-in fade-in-0 zoom-in-95 duration-200 ease-out focus:outline-none motion-reduce:animate-none',
          ancho,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 id="ventana-titulo" className="text-lg font-semibold text-foreground">{titulo}</h2>
            {descripcion && <p className="mt-0.5 text-sm text-muted-foreground">{descripcion}</p>}
          </div>
          {cerrable && (
            <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {acciones && <div className="flex flex-wrap justify-end gap-2 border-t border-border px-6 py-4">{acciones}</div>}
      </div>
    </div>,
    document.body,
  )
}
