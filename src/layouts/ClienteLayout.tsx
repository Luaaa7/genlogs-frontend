import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import logoGenlogs from "@/assets/GENLOGS.png"
import { vitrinaHabilitada } from "@/lib/interruptores"
import { cerrarSesionCliente } from "@/lib/sesiones"

export function ClienteLayout() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/portal/pedidos" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <img src={logoGenlogs} alt="GenLogs S.A.C." width={140} height={58} className="-my-2 h-14 w-auto object-contain dark:brightness-0 dark:invert" />
          </Link>
          <nav aria-label="Portal del cliente" className="flex items-center gap-1 text-sm">
            <NavLink to="/portal/pedidos" className={({ isActive }) => `rounded-md px-3 py-2 ${isActive ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>Mis pedidos</NavLink>
            <NavLink to="/portal/cotizaciones" className={({ isActive }) => `rounded-md px-3 py-2 ${isActive ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>Mis cotizaciones</NavLink>
            {vitrinaHabilitada && <NavLink to="/portal/repuestos" className={({ isActive }) => `rounded-md px-3 py-2 ${isActive ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>Repuestos</NavLink>}
            <NavLink to="/portal/reclamos" className={({ isActive }) => `rounded-md px-3 py-2 ${isActive ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>Reclamos</NavLink>
            <NavLink to="/portal/solicitud" className={({ isActive }) => `rounded-md px-3 py-2 ${isActive ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>Nueva solicitud</NavLink>
            <button type="button" onClick={() => { cerrarSesionCliente(); navigate("/portal/ingreso", { replace: true }) }} className="ml-1 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cerrar sesión</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><Outlet /></main>
    </div>
  )
}
