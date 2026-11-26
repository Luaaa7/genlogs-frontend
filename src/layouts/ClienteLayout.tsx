import { useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronDown, Menu, Moon, Sun, X } from "lucide-react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import logoGenlogs from "@/assets/GENLOGS.webp"
import { useTheme } from "@/hooks/useTheme"
import { vitrinaHabilitada } from "@/lib/interruptores"
import { cerrarSesionCliente, leerSesionCliente } from "@/lib/sesiones"

const foco = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

const claseEnlace = ({ isActive }: { isActive: boolean }) =>
  `shrink-0 whitespace-nowrap rounded-md px-2.5 py-2 xl:px-3 ${isActive ? "bg-slate-100 font-medium text-[#183153] dark:bg-muted dark:text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`

const claseEnlaceMovil = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2.5 text-base ${isActive ? "bg-slate-100 font-medium text-[#183153] dark:bg-muted dark:text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`

const claseBotonBarra = `shrink-0 whitespace-nowrap rounded-md px-2.5 py-2 text-muted-foreground hover:bg-muted hover:text-foreground xl:px-3 ${foco}`

/**
 * Barra del portal del cliente. Con sesión de cliente, en escritorio (xl, desde 1280 px) deja las secciones operativas a la
 * vista y agrupa Ayuda y Contacto en «Soporte»; en pantallas chicas todo va en el panel de la hamburguesa, así
 * que la barra nunca se desborda ni necesita scroll horizontal. «Nueva solicitud» ya tiene su botón amarillo
 * en cada vista y solo se repite en el panel móvil. Sin sesión (por ejemplo en /portal/ingreso y
 * /portal/registro) solo ofrece «Ingresar» y «Crear cuenta» (BPMN v3.4 de Mell, PS2/PS3).
 * Con `children` los muestra en lugar de la ruta hija (portal de una cuenta sin empresa).
 */
export function ClienteLayout({ children }: { children?: ReactNode }) {
  const navigate = useNavigate()
  // Se vuelve a leer la sesión en cada cambio de ruta (al ingresar o al cerrar sesión).
  const { pathname } = useLocation()
  const conSesion = leerSesionCliente() !== null
  // Mismo hook y misma clave («genlogs-theme») que la landing: el portal conserva el tema elegido allí.
  const { tema, alternarTema } = useTheme()

  // Soporte y el panel móvil guardan en qué ruta se abrieron: al navegar a otra, se cierran solos.
  const [soporteEn, setSoporteEn] = useState<string | null>(null)
  const [menuEn, setMenuEn] = useState<string | null>(null)
  const soporteAbierto = soporteEn === pathname
  const menuAbierto = menuEn === pathname
  const soporteRef = useRef<HTMLDivElement>(null)
  const hamburguesaRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!soporteAbierto && !menuAbierto) return
    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape") return
      if (menuAbierto) hamburguesaRef.current?.focus()
      setSoporteEn(null)
      setMenuEn(null)
    }
    const alHacerClic = (evento: MouseEvent) => {
      if (soporteAbierto && !soporteRef.current?.contains(evento.target as Node)) setSoporteEn(null)
    }
    document.addEventListener("keydown", alPulsar)
    document.addEventListener("mousedown", alHacerClic)
    return () => {
      document.removeEventListener("keydown", alPulsar)
      document.removeEventListener("mousedown", alHacerClic)
    }
  }, [soporteAbierto, menuAbierto])

  function cerrarSesion() {
    cerrarSesionCliente()
    navigate("/portal/ingreso", { replace: true })
  }

  const botonTema = (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={tema === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      className={`shrink-0 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground ${foco}`}
    >
      {tema === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  )

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-foreground dark:bg-background">
      <header className="border-b border-slate-200 bg-white dark:border-border dark:bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link to={conSesion ? "/portal/pedidos" : "/"} className={`shrink-0 rounded-lg ${foco}`}>
            <img src={logoGenlogs} alt="GenLogs S.A.C." width={140} height={58} className="-my-2 h-14 w-auto object-contain dark:brightness-0 dark:invert" />
          </Link>

          <nav aria-label="Portal del cliente" className="hidden items-center gap-1 text-sm xl:flex">
            {conSesion ? (
              <>
                <NavLink to="/portal/pedidos" className={claseEnlace}>Mis pedidos</NavLink>
                <NavLink to="/portal/cotizaciones" className={claseEnlace}>Mis cotizaciones</NavLink>
                <NavLink to="/portal/comprobantes" className={claseEnlace}>Mis comprobantes</NavLink>
                <NavLink to="/portal/despachos" className={claseEnlace}>Mis despachos</NavLink>
                {vitrinaHabilitada && <NavLink to="/portal/repuestos" className={claseEnlace}>Repuestos</NavLink>}
                <NavLink to="/portal/reclamos" className={claseEnlace}>Reclamos</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/portal/ingreso" className={claseEnlace}>Ingresar</NavLink>
                <NavLink to="/portal/registro" className={claseEnlace}>Crear cuenta</NavLink>
              </>
            )}
          </nav>

          <div className="flex shrink-0 items-center gap-1 text-sm">
            <div ref={soporteRef} className="relative hidden xl:block">
              <button
                type="button"
                aria-expanded={soporteAbierto}
                aria-controls="portal-soporte"
                onClick={() => setSoporteEn(soporteAbierto ? null : pathname)}
                className={`inline-flex items-center gap-1 ${claseBotonBarra}`}
              >
                Soporte
                <ChevronDown className={`h-4 w-4 transition-transform motion-reduce:transition-none ${soporteAbierto ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {soporteAbierto && (
                <div
                  id="portal-soporte"
                  role="group"
                  aria-label="Soporte"
                  onClick={(evento) => {
                    if ((evento.target as HTMLElement).closest("a")) setSoporteEn(null)
                  }}
                  className="absolute right-0 top-full z-20 mt-1 flex w-40 flex-col rounded-md border border-slate-200 bg-white p-1 shadow-md dark:border-border dark:bg-card"
                >
                  <NavLink to="/ayuda" className={claseEnlace}>Ayuda</NavLink>
                  <NavLink to="/contacto" className={claseEnlace}>Contacto</NavLink>
                </div>
              )}
            </div>
            {botonTema}
            {conSesion && (
              <button type="button" onClick={cerrarSesion} className={`hidden xl:inline-flex ${claseBotonBarra}`}>
                Cerrar sesión
              </button>
            )}
            <button
              ref={hamburguesaRef}
              type="button"
              aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuAbierto}
              aria-controls="menu-portal-movil"
              onClick={() => setMenuEn(menuAbierto ? null : pathname)}
              className={`rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground xl:hidden ${foco}`}
            >
              {menuAbierto ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {menuAbierto && (
          <nav
            id="menu-portal-movil"
            aria-label="Menú del portal"
            onClick={(evento) => {
              if ((evento.target as HTMLElement).closest("a")) setMenuEn(null)
            }}
            className="max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t border-slate-200 bg-white px-4 py-3 dark:border-border dark:bg-card xl:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {conSesion ? (
                <>
                  <NavLink to="/portal/pedidos" className={claseEnlaceMovil}>Mis pedidos</NavLink>
                  <NavLink to="/portal/cotizaciones" className={claseEnlaceMovil}>Mis cotizaciones</NavLink>
                  <NavLink to="/portal/comprobantes" className={claseEnlaceMovil}>Mis comprobantes</NavLink>
                  <NavLink to="/portal/despachos" className={claseEnlaceMovil}>Mis despachos</NavLink>
                  {vitrinaHabilitada && <NavLink to="/portal/repuestos" className={claseEnlaceMovil}>Repuestos</NavLink>}
                  <NavLink to="/portal/reclamos" className={claseEnlaceMovil}>Reclamos</NavLink>
                  <NavLink to="/portal/solicitud" className={claseEnlaceMovil}>Nueva solicitud</NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/portal/ingreso" className={claseEnlaceMovil}>Ingresar</NavLink>
                  <NavLink to="/portal/registro" className={claseEnlaceMovil}>Crear cuenta</NavLink>
                </>
              )}
              <NavLink to="/ayuda" className={claseEnlaceMovil}>Ayuda</NavLink>
              <NavLink to="/contacto" className={claseEnlaceMovil}>Contacto</NavLink>
              {conSesion && (
                <button
                  type="button"
                  onClick={cerrarSesion}
                  className={`block rounded-md px-3 py-2.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground ${foco}`}
                >
                  Cerrar sesión
                </button>
              )}
            </div>
          </nav>
        )}
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children ?? <Outlet />}</main>
      <footer className="border-t border-slate-200 bg-muted/40 dark:border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} GenLogs S.A.C. Soluciones para minería.</p>
          <nav aria-label="Enlaces del pie" className="flex items-center gap-4">
            <Link to="/ayuda" className={`hover:text-foreground ${foco}`}>Ayuda</Link>
            <Link to="/contacto" className={`hover:text-foreground ${foco}`}>Contacto</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
