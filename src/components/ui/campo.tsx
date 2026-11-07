import { useEffect, useId, useRef, type ReactNode } from "react"
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
      {/* Sin role="alert": con varios errores se anunciaban todos seguidos (#62). El error se lee al
          enfocar el campo (aria-describedby) y react-hook-form lleva el foco al primer campo con error. */}
      {error && <p id={`${id}-error`} className="text-xs text-destructive">{error}</p>}
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

/** Leyenda "* Campo obligatorio" para el inicio de un formulario. */
export function LeyendaObligatorio() {
  return (
    <p className="text-xs text-muted-foreground">
      <span className="text-destructive" aria-hidden="true">*</span> Campo obligatorio
    </p>
  )
}

/** Recorre el objeto de errores de react-hook-form y devuelve las rutas de los campos con error
 *  (sin los índices de listas: "detalles.0.producto" → "detalles.producto"). */
function rutasConError(errores: unknown, prefijo = ""): string[] {
  if (!errores || typeof errores !== "object") return []
  const objeto = errores as Record<string, unknown>
  if (typeof objeto.message === "string" || typeof objeto.type === "string") return prefijo ? [prefijo] : []
  return Object.entries(objeto).flatMap(([clave, valor]) => {
    if (clave === "ref") return []
    const siguiente = /^\d+$/.test(clave) ? prefijo : prefijo ? `${prefijo}.${clave}` : clave
    return rutasConError(valor, siguiente)
  })
}

/** Aviso sobre el formulario: "Falta completar: A, B". Solo aparece cuando hay errores
 *  (react-hook-form los llena al intentar guardar) y se lleva a la vista. */
export function ResumenFaltantes({ errors, etiquetas }: { errors: unknown; etiquetas: Record<string, string> }) {
  const referencia = useRef<HTMLDivElement>(null)
  const nombres = Array.from(
    new Set(
      rutasConError(errors).map((ruta) => {
        const partes = ruta.split(".")
        while (partes.length > 0) {
          const nombre = etiquetas[partes.join(".")]
          if (nombre) return nombre
          partes.pop()
        }
        return ""
      }).filter(Boolean),
    ),
  )
  const texto = nombres.join(", ")
  useEffect(() => {
    if (texto) referencia.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [texto])
  if (nombres.length === 0) return null
  return (
    <div
      ref={referencia}
      role="alert"
      className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <strong className="font-semibold">Falta completar:</strong> {texto}
    </div>
  )
}
