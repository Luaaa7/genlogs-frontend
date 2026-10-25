import { useEffect, useRef } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  /** "destructive" (rojo, para eliminar/desactivar) o "default" (acento). */
  variant?: "destructive" | "default"
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Modal de confirmación propio, con el mismo lenguaje visual del resto del
 *  sistema — reemplaza el `window.confirm()` nativo del navegador, que se ve
 *  genérico y no puede explicar la consecuencia de la acción ni mostrar un
 *  estado "guardando…" mientras se procesa. Pensado para acciones
 *  destructivas o irreversibles (eliminar contacto, desactivar servicio). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "destructive",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel()
    }
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 animate-in fade-in-0 duration-200 motion-reduce:animate-none"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Entrada: opacidad + scale(0.95→1) centrada (los modales no salen de
          un disparador), 200ms ease-out; sin movimiento con reduced-motion. */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200 ease-out motion-reduce:animate-none"
      >
        <div className="flex items-start gap-3">
          <div
            className={
              variant === "destructive"
                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"
            }
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id="confirm-dialog-title" className="text-base font-semibold text-foreground">
              {title}
            </h2>
            <p id="confirm-dialog-description" className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button ref={cancelRef} type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Procesando…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
