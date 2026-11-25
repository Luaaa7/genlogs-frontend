import { forwardRef, useId, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input, type InputProps } from "@/components/ui/input"
import { cn } from "@/lib/utils/utils"

interface CampoPasswordProps extends Omit<InputProps, "type"> {
  /** Qué nombra el botón del ojo: «Mostrar contraseña», «Mostrar confirmación»... */
  etiquetaVer?: string
}

/**
 * Campo de contraseña del acceso del cliente (ingreso y registro): el mismo <Input> de siempre con el
 * «ojito» para mostrar u ocultar lo escrito y un aviso discreto cuando Bloq Mayús está activo.
 * El ojito queda fuera del orden del Tab (tabIndex -1) para no interrumpir el paso entre campos.
 * Sirve con campo controlado o sin controlar, y entrega su ref al input.
 */
export const CampoPassword = forwardRef<HTMLInputElement, CampoPasswordProps>(function CampoPassword(
  { etiquetaVer = "contraseña", className, id, onKeyDown, onKeyUp, onBlur, "aria-describedby": describedBy, ...props },
  ref,
) {
  const idGenerado = useId()
  const idAviso = `${id ?? idGenerado}-bloq-mayus`
  const [visible, setVisible] = useState(false)
  const [bloqMayus, setBloqMayus] = useState(false)
  const Icono = visible ? EyeOff : Eye

  return (
    <>
      <div className="relative mt-2">
        <Input
          {...props}
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          className={cn("pr-10", className)}
          aria-describedby={[describedBy, bloqMayus ? idAviso : undefined].filter(Boolean).join(" ") || undefined}
          onKeyDown={(e) => {
            setBloqMayus(e.getModifierState("CapsLock"))
            onKeyDown?.(e)
          }}
          onKeyUp={(e) => {
            setBloqMayus(e.getModifierState("CapsLock"))
            onKeyUp?.(e)
          }}
          onBlur={(e) => {
            setBloqMayus(false)
            onBlur?.(e)
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={`${visible ? "Ocultar" : "Mostrar"} ${etiquetaVer}`}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icono className="size-4" aria-hidden="true" />
        </button>
      </div>
      {bloqMayus && (
        <p id={idAviso} role="status" className="mt-1.5 text-sm text-muted-foreground">
          Bloq Mayús está activado
        </p>
      )}
    </>
  )
})
