import { Link, Outlet } from "react-router-dom"
import { Moon, Sun } from "lucide-react"
import logoGenlogs from "@/assets/GENLOGS.png"
import { useTheme } from "@/hooks/useTheme"

export function PublicLayout() {
  const { tema, alternarTema } = useTheme()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <img src={logoGenlogs} alt="GenLogs S.A.C." width={150} height={62} className="-my-2 h-16 w-auto object-contain dark:brightness-0 dark:invert" />
          </Link>
          <nav aria-label="Navegación principal" className="flex items-center gap-2">
            <a href="#contacto" className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex">Contacto</a>
            <button type="button" onClick={alternarTema} aria-label={tema === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {tema === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/portal/registro" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Ingresar</Link>
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
