import { Link } from "react-router-dom"
import { FileText } from "lucide-react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import { formatCurrency } from "@/lib/formatters/currency"
import { BotonNuevaSolicitud } from "../components/BotonNuevaSolicitud"
import { ListaEsqueleto } from "../components/SkeletonCard"
import { useCotizacionesPortal } from "../hooks/useCotizacionesPortal"
import { esCotizacionAnulada, puedeDecidir, tonoEstadoCotizacion } from "../lib/cotizacionPortal"

export function MisCotizacionesPage() {
  const query = useCotizacionesPortal()
  const cotizaciones = query.data ?? []

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis cotizaciones</h1>
          <p className="mt-2 text-muted-foreground">Revisa cada cotización y apruébala o recházala antes de su fecha de validez.</p>
        </div>
        <BotonNuevaSolicitud />
      </div>
      {query.isPending ? (
        <div className="mt-8"><ListaEsqueleto variante="cotizacion" etiqueta="Cargando cotizaciones..." /></div>
      ) : query.isError ? (
        <div className="mt-8"><ErrorBanner message="No pudimos cargar tus cotizaciones." onRetry={() => query.refetch()} /></div>
      ) : cotizaciones.length === 0 ? (
        <p className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card p-8 text-center text-muted-foreground">
          Todavía no tienes cotizaciones. Cuando coticemos uno de tus pedidos, aparecerá aquí.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-slate-200 dark:divide-border rounded-xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
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
                    {esCotizacionAnulada(c) && c.motivoAnulacion && (
                      <span className="mt-1 block text-sm">Motivo: {c.motivoAnulacion}</span>
                    )}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-lg font-semibold tabular-nums">{formatCurrency(Number(c.total ?? 0), c.moneda ?? "PEN")}</span>
                  <EstadoBadge tono={tonoEstadoCotizacion(c.estado)}>
                    {esCotizacionAnulada(c) ? "Anulada" : c.estado}
                  </EstadoBadge>
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
