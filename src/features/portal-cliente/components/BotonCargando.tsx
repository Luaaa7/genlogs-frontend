import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { Button, type ButtonProps } from "@/components/ui/button"

interface BotonCargandoProps extends ButtonProps {
  cargando: boolean
  /** Etiqueta mientras espera la respuesta, en gerundio: «Registrando solicitud...». */
  textoCargando: string
  /** Icono de reposo; mientras carga lo reemplaza el spinner. */
  icono?: ReactNode
}

/** Botón de envío o confirmación: mientras espera la API muestra un spinner a la izquierda, se deshabilita y cambia su etiqueta. */
export function BotonCargando({ cargando, textoCargando, icono, disabled, children, ...props }: BotonCargandoProps) {
  return (
    <Button {...props} disabled={disabled || cargando} aria-busy={cargando || undefined}>
      {cargando ? <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : icono}
      {cargando ? textoCargando : children}
    </Button>
  )
}
