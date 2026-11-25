import { Link } from "react-router-dom"

/** Enlace de navegación bajo el aviso «esta cuenta no es del portal»: el personal ingresa por /login. */
export function EnlaceIngresoPersonal() {
  return (
    <p className="text-sm">
      <Link
        to="/login"
        className="rounded-sm font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Ir al ingreso del personal
      </Link>
    </p>
  )
}
