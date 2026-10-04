import { Link, Outlet } from "react-router-dom"
import { Sun, Moon, ShieldCheck, Lock } from "lucide-react"
import logoGenlogs from "../assets/GENLOGS.png"
import { useTheme } from "@/hooks/useTheme"

/**
 * Layout compartido por Login / Recuperar contraseña / Reset de contraseña.
 *
 * Una sola columna centrada: logo en sus colores originales, la card del
 * formulario y las garantías de acceso debajo. Sin panel de marca, degradados
 * ni manchas: el login es una herramienta de trabajo, igual que el resto del
 * ERP. Cada pantalla (Recuperar / Nueva contraseña) trae su propio
 * "Volver al inicio de sesión".
 */
export function AuthLayout() {
  const { tema, alternarTema } = useTheme()

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-muted/60 px-4 py-10 sm:px-6 dark:bg-background">
      <button
        type="button"
        onClick={alternarTema}
        aria-label={tema === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:right-6 sm:top-6"
      >
        {tema === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
      </button>

      <div className="w-full max-w-sm">
        {/* Lleva a /login (y no a "/", que sin sesión rebota al mismo login):
            útil desde Recuperar y Nueva contraseña. GENLOGS.png trae margen
            transparente arriba y abajo; el margen negativo lo compensa. */}
        <Link
          to="/login"
          className="mx-auto mb-4 block w-fit rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <img
            src={logoGenlogs}
            alt="GenLogs S.A.C."
            width={192}
            height={80}
            className="-my-3 h-24 w-auto object-contain dark:brightness-0 dark:invert"
          />
        </Link>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <Outlet />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Lock size={14} aria-hidden="true" /> Conexión cifrada
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={14} aria-hidden="true" /> Acceso restringido por rol
          </span>
        </div>
      </div>
    </div>
  )
}
