import type { ReactNode } from "react"
import { cn } from "@/lib/utils/utils"

interface CampoProps {
  /** id del control: une label, ayuda y error (aria-describedby). */
  id: string
  label: string
  /** Texto de ayuda permanente bajo el control. */
  ayuda?: string
  error?: string
  opcional?: boolean
  className?: string
  children: ReactNode
}

/** Campo de formulario: label arriba, control, ayuda y error debajo. El control
 *  lleva id={id}, aria-invalid y aria-describedby={describedBy(id, …)}
 *  (clases y helper en campoEstilos.ts). */
export function Campo({ id, label, ayuda, error, opcional, className, children }: CampoProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {opcional && <span className="ml-1 font-normal text-muted-foreground">(opcional)</span>}
      </label>
      {children}
      {ayuda && !error && <p id={`${id}-ayuda`} className="text-xs text-muted-foreground">{ayuda}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

/** Sección de un formulario largo, con título y descripción. */
export function SeccionForm({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <legend className="sr-only">{titulo}</legend>
      <div aria-hidden="true">
        <p className="text-sm font-semibold text-foreground">{titulo}</p>
        {descripcion && <p className="mt-0.5 text-xs text-muted-foreground">{descripcion}</p>}
      </div>
      {children}
    </fieldset>
  )
}
