import { Link } from "react-router-dom"
import { FileText } from "lucide-react"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import { formatCurrency } from "@/lib/formatters/currency"
import { useCotizacionesPortal } from "../hooks/useCotizacionesPortal"
import { puedeDecidir, tonoEstadoCotizacion } from "../lib/cotizacionPortal"

export function MisCotizacionesPage() {
  const query = useCotizacionesPortal()
  if (query.isPending) return <CargandoSpinner texto="Cargando cotizaciones..." />
  if (query.isError) return <ErrorBanner message="No pudimos cargar tus cotizaciones." onRetry={() => query.refetch()} />
  const cotizaciones = query.data ?? []

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold">Mis cotizaciones</h1>
      <p className="mt-2 text-muted-foreground">Revisa cada cotización y apruébala o recházala antes de su fecha de validez.</p>
      {cotizaciones.length === 0 ? (
        <p className="mt-8 rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Todavía no tienes cotizaciones. Cuando coticemos uno de tus pedidos, aparecerá aquí.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border rounded-xl border border-border bg-card">
          {cotizaciones.map((c) => (
            <li key={c.id}>
              <Link
                to={`/portal/cotizaciones/${c.id}`}
                className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
              >
                <span className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-accent" aria-hidden="true" />
                  <span>
                    <span className="block font-medium">{c.codigo}</span>
                    <span className="block text-sm text-muted-foreground">
                      {c.fechaValidez ? `Válida hasta ${new Date(`${c.fechaValidez}T00:00:00`).toLocaleDateString("es-PE")}` : "Sin fecha de validez"}
                      {c.numeroOcCliente ? ` · OC ${c.numeroOcCliente}` : ""}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-lg font-semibold tabular-nums">{formatCurrency(Number(c.total ?? 0), c.moneda ?? "PEN")}</span>
                  <EstadoBadge tono={tonoEstadoCotizacion(c.estado)}>{c.estado}</EstadoBadge>
                  {puedeDecidir(c) && <span className="text-sm font-medium text-accent">Revisar</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
