import type { ReactNode } from "react"
import { Moon, Sun } from "lucide-react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import logoGenlogs from "@/assets/GENLOGS.webp"
import { useTheme } from "@/hooks/useTheme"
import { vitrinaHabilitada } from "@/lib/interruptores"
import { cerrarSesionCliente, leerSesionCliente } from "@/lib/sesiones"

const claseEnlace = ({ isActive }: { isActive: boolean }) =>
  `shrink-0 whitespace-nowrap rounded-md px-3 py-2 ${isActive ? "bg-slate-100 font-medium text-[#183153] dark:bg-muted dark:text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`

/**
 * Barra del portal del cliente. Con sesión de cliente muestra el menú completo; «Nueva solicitud»
 * es un enlace más; «Cerrar sesión» y el botón de tema van a la derecha (v3.4). Sin sesión (por ejemplo en
 * /portal/ingreso y /portal/registro) solo muestra «Ingresar» y «Crear cuenta» (BPMN v3.4 de Mell, PS2/PS3).
 * Con `children` los muestra en lugar de la ruta hija (portal de una cuenta sin empresa).
 */
export function ClienteLayout({ children }: { children?: ReactNode }) {
  const navigate = useNavigate()
  // Se vuelve a leer la sesión en cada cambio de ruta (al ingresar o al cerrar sesión).
  useLocation()
  const conSesion = leerSesionCliente() !== null
  // Mismo hook y misma clave («genlogs-theme») que la landing: el portal conserva el tema elegido allí.
  const { tema, alternarTema } = useTheme()
  const botonTema = (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={tema === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {tema === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  )

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-foreground dark:bg-background">
      <header className="border-b border-slate-200 bg-white dark:border-border dark:bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link to={conSesion ? "/portal/pedidos" : "/"} className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <img src={logoGenlogs} alt="GenLogs S.A.C." width={140} height={58} className="-my-2 h-14 w-auto object-contain dark:brightness-0 dark:invert" />
          </Link>
          {conSesion ? (
            <nav aria-label="Portal del cliente" className="min-w-0 overflow-x-auto">
            <div className="flex w-max items-center gap-1 whitespace-nowrap text-sm">
              <NavLink to="/portal/pedidos" className={claseEnlace}>Mis pedidos</NavLink>
              <NavLink to="/portal/cotizaciones" className={claseEnlace}>Mis cotizaciones</NavLink>
              <NavLink to="/portal/comprobantes" className={claseEnlace}>Mis comprobantes</NavLink>
              <NavLink to="/portal/despachos" className={claseEnlace}>Mis despachos</NavLink>
              {vitrinaHabilitada && <NavLink to="/portal/repuestos" className={claseEnlace}>Repuestos</NavLink>}
              <NavLink to="/portal/reclamos" className={claseEnlace}>Reclamos</NavLink>
              <NavLink to="/ayuda" className={claseEnlace}>Ayuda</NavLink>
              <NavLink to="/contacto" className={claseEnlace}>Contacto</NavLink>
              <span aria-hidden="true" className="mx-1 hidden h-5 w-px shrink-0 bg-border sm:block" />
              <NavLink to="/portal/solicitud" className={claseEnlace}>Nueva solicitud</NavLink>
              <button
                type="button"
                onClick={() => {
                  cerrarSesionCliente()
                  navigate("/portal/ingreso", { replace: true })
                }}
                className="shrink-0 whitespace-nowrap rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cerrar sesión
              </button>
              {botonTema}
            </div>
            </nav>
          ) : (
            <nav aria-label="Portal del cliente" className="min-w-0 overflow-x-auto">
            <div className="flex w-max items-center gap-1 whitespace-nowrap text-sm">
              <NavLink to="/portal/ingreso" className={claseEnlace}>Ingresar</NavLink>
              <NavLink to="/portal/registro" className={claseEnlace}>Crear cuenta</NavLink>
              <NavLink to="/ayuda" className={claseEnlace}>Ayuda</NavLink>
              <NavLink to="/contacto" className={claseEnlace}>Contacto</NavLink>
              {botonTema}
            </div>
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children ?? <Outlet />}</main>
      <footer className="border-t border-slate-200 bg-muted/40 dark:border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} GenLogs S.A.C. Soluciones para minería.</p>
          <nav aria-label="Enlaces del pie" className="flex items-center gap-4">
            <Link to="/ayuda" className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Ayuda</Link>
            <Link to="/contacto" className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Contacto</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}