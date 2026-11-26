import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

const FOCO = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

/**
 * Botón principal de las vistas del portal: mismo amarillo institucional de la landing.
 * La variante «pildora» (encabezado de Mis pedidos) es redonda y lleva una flecha.
 */
export function BotonNuevaSolicitud({ variante = "normal" }: { variante?: "normal" | "pildora" }) {
  if (variante === "pildora") {
    return (
      <Link
        to="/portal/solicitud"
        className={`group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#FACC15] px-6 py-3 text-base font-extrabold text-[#183153] shadow-md transition hover:-translate-y-0.5 hover:bg-[#EAB308] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${FOCO}`}
      >
        Nueva solicitud
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
      </Link>
    )
  }
  return (
    <Link
      to="/portal/solicitud"
      className={`inline-flex shrink-0 items-center justify-center rounded-md bg-[#FACC15] px-4 py-2.5 text-sm font-bold text-[#183153] shadow-sm transition-colors hover:bg-[#EAB308] motion-reduce:transition-none ${FOCO}`}
    >
      Nueva solicitud
    </Link>
  )
}
