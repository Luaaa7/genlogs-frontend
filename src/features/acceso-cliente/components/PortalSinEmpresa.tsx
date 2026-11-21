import { Link } from "react-router-dom"
import { ClipboardList } from "lucide-react"

/**
 * Lo que ve en el portal una cuenta que entró con Google y todavía no dio los datos de
 * su empresa (v3.4): todavía no tiene pedidos, cotizaciones ni despachos.
 */
export function PortalSinEmpresa() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-8 text-center shadow-sm">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent" aria-hidden="true">
        <ClipboardList className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-2xl font-bold">Aún no tienes pedidos</h1>
      <p className="mt-2 text-muted-foreground">
        Aquí verás tus pedidos, cotizaciones, despachos y reclamos. Cuando pidas tu primera
        cotización te pediremos los datos de tu empresa una sola vez.
      </p>
      <Link
        to="/portal/solicitud"
        className="mt-6 inline-flex justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Pedir mi primera cotización
      </Link>
    </div>
  )
}
