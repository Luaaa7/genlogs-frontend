import { Link } from "react-router-dom"
import { ChevronRight, FileText } from "lucide-react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import { formatCurrency } from "@/lib/formatters/currency"
import { BotonNuevaSolicitud } from "../components/BotonNuevaSolicitud"
import { EncabezadoPortal } from "../components/EncabezadoPortal"
import { EstadoVacioIlustrado } from "../components/EstadoVacioIlustrado"
import { ListaEsqueleto } from "../components/SkeletonCard"
import { useCotizacionesPortal } from "../hooks/useCotizacionesPortal"
import { esCotizacionAnulada, puedeDecidir, tonoEstadoCotizacion } from "../lib/cotizacionPortal"
import { ENTRADA_TARJETA, TARJETA_ELEVABLE, retardoEntrada } from "../lib/estilosTarjeta"

export function MisCotizacionesPage() {
  const query = useCotizacionesPortal()
  const cotizaciones = query.data ?? []

  return (
    <div>
      <EncabezadoPortal
        titulo="Mis cotizaciones"
        descripcion="Revisa cada cotización y apruébala o recházala antes de su fecha de validez."
        accion={<BotonNuevaSolicitud variante="pildora" />}
      />
      {query.isPending ? (
        <div className="mt-6"><ListaEsqueleto variante="cotizacion" etiqueta="Cargando cotizaciones..." /></div>
      ) : query.isError ? (
        <div className="mt-6"><ErrorBanner message="No pudimos cargar tus cotizaciones." onRetry={() => query.refetch()} /></div>
      ) : cotizaciones.length === 0 ? (
        <EstadoVacioIlustrado
          ilustracion="cotizaciones"
          titulo="Todavía no tienes cotizaciones"
          descripcion="Cuando coticemos uno de tus pedidos, aparecerá aquí."
          accion={<Link to="/portal/solicitud" className="inline-flex items-center rounded-md bg-[#FACC15] px-4 py-2 text-sm font-bold text-[#183153] hover:bg-[#EAB308] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Crear mi primera solicitud</Link>}
        />
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {cotizaciones.map((c, indice) => (
            <li
              key={c.id}
              style={retardoEntrada(indice)}
              className={`group rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-card ${TARJETA_ELEVABLE} ${ENTRADA_TARJETA}`}
            >
              <Link
                to={`/portal/cotizaciones/${c.id}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
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
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
