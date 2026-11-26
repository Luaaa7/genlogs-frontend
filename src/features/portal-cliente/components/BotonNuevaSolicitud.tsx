import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

const FOCO = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
const ELEVA = "transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#EAB308] hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
const FLECHA = "shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"

/**
 * Botón principal de las vistas del portal: mismo amarillo institucional de la landing.
 * Se eleva un poco al pasar el cursor y su flecha se desplaza. La variante «pildora» (encabezado) es redonda y más grande.
 */
export function BotonNuevaSolicitud({ variante = "normal" }: { variante?: "normal" | "pildora" }) {
  if (variante === "pildora") {
    return (
      <Link
        to="/portal/solicitud"
        className={`group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#FACC15] px-6 py-3 text-base font-extrabold text-[#183153] shadow-md ${ELEVA} ${FOCO}`}
      >
        Nueva solicitud
        <ArrowRight className={`h-5 w-5 ${FLECHA}`} aria-hidden="true" />
      </Link>
    )
  }
  return (
    <Link
      to="/portal/solicitud"
      className={`group inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-[#FACC15] px-4 py-2.5 text-sm font-bold text-[#183153] shadow-sm ${ELEVA} ${FOCO}`}
    >
      Nueva solicitud
      <ArrowRight className={`h-4 w-4 ${FLECHA}`} aria-hidden="true" />
    </Link>
  )
}
