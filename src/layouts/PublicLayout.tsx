import { Link, Outlet, useLocation } from "react-router-dom"
import { ArrowRight, Moon, Sun, User } from "lucide-react"
import logoGenlogs from "@/assets/GENLOGS.webp"
import { useTheme } from "@/hooks/useTheme"

const enlaceNav = "gl-nl relative hidden px-3.5 py-2.5 text-[15px] font-medium text-primary dark:text-foreground sm:inline-flex"
const foco = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function PublicLayout() {
  const { tema, alternarTema } = useTheme()
  // En la landing el enlace es solo «#…»; en otras páginas vuelve a la landing con el ancla.
  const prefijo = useLocation().pathname === "/" ? "" : "/"

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className={`rounded-lg ${foco}`}>
            <img src={logoGenlogs} alt="GenLogs S.A.C." width={192} height={80} className="-my-3 h-20 w-auto object-contain dark:brightness-0 dark:invert" />
          </Link>
          <nav aria-label="Navegación principal" className="flex items-center gap-1">
            <a href={`${prefijo}#catalogo`} className={`${enlaceNav} ${foco}`}>Catálogo</a>
            <a href="#contacto" className={`${enlaceNav} ${foco}`}>Contacto</a>
            <span aria-hidden="true" className="mx-2.5 hidden h-[26px] w-px bg-border dark:bg-foreground/25 sm:block" />
            <button type="button" onClick={alternarTema} aria-label={tema === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"} className={`rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground ${foco}`}>
              {tema === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/portal/ingreso" className={`flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-[15px] font-semibold text-primary hover:bg-primary/[0.06] dark:border-foreground/45 dark:text-foreground dark:hover:bg-foreground/10 ${foco}`}>
              <User className="h-[17px] w-[17px]" aria-hidden="true" /><span className="sr-only sm:not-sr-only">Portal de clientes</span>
            </Link>
            <a href={`${prefijo}#solicitud`} className={`group ml-2 hidden h-11 sm:flex items-center gap-2 rounded-xl border-2 border-primary bg-amarillo px-4 text-[15px] font-extrabold text-[#0f2440] shadow-[0_8px_20px_rgb(8_20_40/0.28)] transition hover:-translate-y-0.5 motion-reduce:transition-none dark:border-transparent ${foco}`}>
              Pedir cotización <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
            </a>
          </nav>
        </div>
      </header>
      <main><Outlet /></main>
      <footer id="contacto" className="border-t border-border bg-muted/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} GenLogs S.A.C. Soluciones para minería.</p>
          <p>Atención comercial y soporte especializado.</p>
        </div>
      </footer>
    </div>
  )
}
