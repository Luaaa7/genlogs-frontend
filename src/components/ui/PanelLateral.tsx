import { useEffect, useRef, type ReactNode } from "react"
import { X } from "lucide-react"

interface PanelLateralProps {
  abierto: boolean
  titulo: string
  descripcion?: string
  onCerrar: () => void
  children: ReactNode
}

/** Panel que entra desde la derecha para crear o editar un registro sin perder
 *  de vista la lista. Escape y clic fuera lo cierran; el foco entra al panel y
 *  vuelve al botón que lo abrió al cerrarse. */
export function PanelLateral({ abierto, titulo, descripcion, onCerrar, children }: PanelLateralProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  // onCerrar suele ser una función nueva en cada render: se lee desde una ref
  // para que el efecto de abajo corra solo al abrir/cerrar (y no robe el foco).
  const onCerrarRef = useRef(onCerrar)
  useEffect(() => {
    onCerrarRef.current = onCerrar
  }, [onCerrar])

  useEffect(() => {
    if (!abierto) return
    const anterior = document.activeElement as HTMLElement | null
    // Foco al primer campo del formulario (o al panel si no hay campos)
    const primerCampo = panelRef.current?.querySelector<HTMLElement>("input, select, textarea")
    ;(primerCampo ?? panelRef.current)?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrarRef.current()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
      anterior?.focus()
    }
  }, [abierto])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/40 animate-in fade-in-0 duration-200 motion-reduce:animate-none" onClick={onCerrar} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-lateral-titulo"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-card shadow-2xl animate-in slide-in-from-right duration-300 ease-out focus:outline-none motion-reduce:animate-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 id="panel-lateral-titulo" className="text-lg font-semibold text-foreground">{titulo}</h2>
            {descripcion && <p className="mt-0.5 text-sm text-muted-foreground">{descripcion}</p>}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
