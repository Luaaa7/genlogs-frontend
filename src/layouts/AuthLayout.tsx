import { Link, Outlet } from "react-router-dom"
import { Sun, Moon, ShieldCheck, Lock, ArrowLeft } from "lucide-react"
import logoGenlogs from "../assets/GENLOGS.png"
import { useTheme } from "@/hooks/useTheme"

/**
 * Layout compartido por Login / Recuperar contraseña / Reset de contraseña.
 *
 * Diseño "hero" de dos paneles (principio de UX: el login es parte del
 * "Shell" del sistema, no una pantalla operativa, así que aquí sí vive el
 * glassmorfismo — ver logica-ux-modulos-genlogs.md):
 *  - Panel izquierdo (solo desktop): mensaje de marca + manchas de color
 *    difuminadas, igual que el fondo de AppLayout.
 *  - Panel derecho: el formulario, en una card con blur, con un enlace
 *    explícito para volver al inicio del sistema.
 */
export function AuthLayout() {
  const { tema, alternarTema } = useTheme()

  return (
    <div className="relative flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Panel izquierdo: hero de marca (oculto en mobile para no competir con el formulario) */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#2E6BA8] lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        {/* Manchas de color difuminadas, mismo lenguaje visual que AppLayout */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
          <div className="absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        </div>

        <Link to="/" className="relative w-fit rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
          <img src={logoGenlogs} alt="GenLogs S.A.C." width={160} height={64} className="h-16 w-auto object-contain" />
        </Link>

        <div className="relative space-y-4">
          <h2 className="text-3xl font-semibold leading-tight text-white xl:text-4xl">
            Gestión comercial para la industria minera, en un solo lugar
          </h2>
          <p className="max-w-md text-sm text-white/70">
            Cotizaciones, órdenes de compra y facturación de GENLOGS S.A.C.,
            centralizadas con trazabilidad completa de cada operación.
          </p>
        </div>

        <div className="relative flex flex-wrap gap-4 text-xs text-white/70">
          <span className="inline-flex items-center gap-1.5">
            <Lock size={14} /> Conexión cifrada
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={14} /> Acceso restringido por rol
          </span>
        </div>
      </div>

      {/* Panel derecho: formulario */}
      <div className="relative flex flex-1 items-center justify-center p-4 sm:p-6">
        <button
          type="button"
          onClick={alternarTema}
          aria-label={tema === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/70 backdrop-blur-xl text-foreground hover:bg-card/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors sm:right-6 sm:top-6"
        >
          {tema === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <ArrowLeft size={14} /> Volver al inicio
          </Link>

          <div className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl p-6 shadow-xl shadow-black/10 sm:p-8">
            {/* Logo solo visible en mobile, donde el panel hero está oculto */}
            <div className="mb-6 flex flex-col items-center justify-center lg:hidden">
              <img
                src={logoGenlogs}
                alt="GenLogs S.A.C."
                width={192}
                height={80}
                className="h-24 w-auto object-contain"
              />
            </div>

            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
