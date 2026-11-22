import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import logoGenlogs from "@/assets/GENLOGS.webp"
import { vitrinaHabilitada } from "@/lib/interruptores"
import { cerrarSesionCliente, leerSesionCliente } from "@/lib/sesiones"

const claseEnlace = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 ${isActive ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`

/**
 * Barra del portal del cliente. Con sesión de cliente muestra el menú completo y
 * «Cerrar sesión». Sin sesión (por ejemplo en /portal/ingreso y /portal/registro)
 * solo muestra «Ingresar» y «Crear cuenta» (BPMN v3.4 de Mell, PS2/PS3).
 */
export function ClienteLayout() {
  const navigate = useNavigate()
  // Se vuelve a leer la sesión en cada cambio de ruta (al ingresar o al cerrar sesión).
  useLocation()
  const conSesion = leerSesionCliente() !== null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link to={conSesion ? "/portal/pedidos" : "/"} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <img src={logoGenlogs} alt="GenLogs S.A.C." width={140} height={58} className="-my-2 h-14 w-auto object-contain dark:brightness-0 dark:invert" />
          </Link>
          {conSesion ? (
            <nav aria-label="Portal del cliente" className="flex items-center gap-1 text-sm">
              <NavLink to="/portal/pedidos" className={claseEnlace}>Mis pedidos</NavLink>
              <NavLink to="/portal/cotizaciones" className={claseEnlace}>Mis cotizaciones</NavLink>
              <NavLink to="/portal/despachos" className={claseEnlace}>Mis despachos</NavLink>
              {vitrinaHabilitada && <NavLink to="/portal/repuestos" className={claseEnlace}>Repuestos</NavLink>}
              <NavLink to="/portal/reclamos" className={claseEnlace}>Reclamos</NavLink>
              <NavLink to="/portal/solicitud" className={claseEnlace}>Nueva solicitud</NavLink>
              <NavLink to="/ayuda" className={claseEnlace}>Ayuda</NavLink>
              <NavLink to="/contacto" className={claseEnlace}>Contáctame</NavLink>
              <button
                type="button"
                onClick={() => {
                  cerrarSesionCliente()
                  navigate("/portal/ingreso", { replace: true })
                }}
                className="ml-1 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cerrar sesión
              </button>
            </nav>
          ) : (
            <nav aria-label="Portal del cliente" className="flex items-center gap-1 text-sm">
              <NavLink to="/portal/ingreso" className={claseEnlace}>Ingresar</NavLink>
              <NavLink to="/portal/registro" className={claseEnlace}>Crear cuenta</NavLink>
              <NavLink to="/ayuda" className={claseEnlace}>Ayuda</NavLink>
              <NavLink to="/contacto" className={claseEnlace}>Contáctame</NavLink>
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><Outlet /></main>
    </div>
  )
}