import { Link } from "react-router-dom"

/** Botón principal de las vistas del portal: mismo amarillo institucional de la landing. */
export function BotonNuevaSolicitud() {
  return (
    <Link
      to="/portal/solicitud"
      className="inline-flex shrink-0 items-center justify-center rounded-md bg-[#FACC15] px-4 py-2.5 text-sm font-bold text-[#183153] shadow-sm transition-colors hover:bg-[#EAB308] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
    >
      Nueva solicitud
    </Link>
  )
}
