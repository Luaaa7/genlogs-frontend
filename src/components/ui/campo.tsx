import { useId, type ReactNode } from "react"
import { cn } from "@/lib/utils/utils"

interface CampoProps {
  /** id del control: une label, ayuda y error (aria-describedby). */
  id: string
  label: string
  /** Texto de ayuda permanente bajo el control. */
  ayuda?: string
  error?: string
  opcional?: boolean
  /** Marca el campo con * y lo anuncia como obligatorio a lectores de pantalla. */
  obligatorio?: boolean
  className?: string
  children: ReactNode
}

/** Campo de formulario: label arriba, control, ayuda y error debajo. El control
 *  lleva id={id}, aria-invalid y aria-describedby={describedBy(id, …)}
 *  (clases y helper en campoEstilos.ts). */
export function Campo({ id, label, ayuda, error, opcional, obligatorio, className, children }: CampoProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {opcional && <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>}
        {obligatorio && <MarcaObligatorio />}
      </label>
      {children}
      {ayuda && !error && <p id={`${id}-ayuda`} className="text-xs text-muted-foreground">{ayuda}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

/** Asterisco de campo obligatorio (el lector de pantalla dice "obligatorio"). */
export function MarcaObligatorio() {
  return (
    <>
      <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
      <span className="sr-only"> (obligatorio)</span>
    </>
  )
}

/** Sección de un formulario largo, con título y descripción. El título se
 *  muestra una sola vez y nombra al grupo (aria-labelledby), en lugar de
 *  repetirlo en un <legend> oculto que los lectores leían dos veces. */
export function SeccionForm({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: ReactNode }) {
  const id = useId()
  return (
    <fieldset aria-labelledby={`${id}-t`} className="flex flex-col gap-4 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <div>
        <p id={`${id}-t`} className="text-sm font-semibold text-foreground">{titulo}</p>
        {descripcion && <p className="mt-0.5 text-xs text-muted-foreground">{descripcion}</p>}
      </div>
      {children}
    </fieldset>
  )
}