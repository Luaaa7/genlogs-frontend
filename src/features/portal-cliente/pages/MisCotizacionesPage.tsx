import { Link } from "react-router-dom"
import { CalendarClock, CalendarDays, CheckCircle2, ChevronRight, FileSignature, FileText, Hourglass, type LucideIcon } from "lucide-react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import { formatCurrency } from "@/lib/formatters/currency"
import { cn } from "@/lib/utils/utils"
import type { CotizacionPortal } from "@/api/portalCotizacionesApi"
import { BotonNuevaSolicitud } from "../components/BotonNuevaSolicitud"
import { EncabezadoPortal } from "../components/EncabezadoPortal"
import { EstadoVacioIlustrado } from "../components/EstadoVacioIlustrado"
import { ListaEsqueleto } from "../components/SkeletonCard"
import { useCotizacionesPortal } from "../hooks/useCotizacionesPortal"
import { diasParaVencer, esCotizacionAnulada, estaAceptada, puedeDecidir, tonoEstadoCotizacion } from "../lib/cotizacionPortal"
import { ENTRADA_TARJETA, ICONO_TARJETA, TARJETA_ELEVABLE, TARJETA_PORTAL, retardoEntrada } from "../lib/estilosTarjeta"

const fechaLegible = (fecha: string) => new Date(`${fecha.slice(0, 10)}T00:00:00`).toLocaleDateString("es-PE")

/** Aviso de vigencia: solo mientras el cliente todavía puede decidir, calculado con la fecha de validez real. */
function avisoVigencia(c: CotizacionPortal): { texto: string; urgente: boolean; Icono: LucideIcon } | null {
  if (!puedeDecidir(c)) return null
  const dias = diasParaVencer(c.fechaValidez)
  if (dias === null || dias < 0) return null
  if (dias === 0) return { texto: "Vence hoy", urgente: true, Icono: Hourglass }
  return { texto: `Vence en ${dias} ${dias === 1 ? "día" : "días"}`, urgente: dias <= 3, Icono: CalendarClock }
}

export function MisCotizacionesPage() {
  const query = useCotizacionesPortal()
  const cotizaciones = query.data ?? []
  const porDecidir = cotizaciones.filter((c) => puedeDecidir(c)).length
  const aceptadas = cotizaciones.filter((c) => estaAceptada(c)).length

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPortal
        titulo="Mis cotizaciones"
        descripcion="Revisa cada cotización y apruébala o recházala antes de su fecha de validez."
        ilustracion="cotizaciones"
        accion={<BotonNuevaSolicitud variante="pildora" />}
        resumen={cotizaciones.length > 0 ? [
          { icono: <FileText />, valor: cotizaciones.length, texto: cotizaciones.length === 1 ? "cotización" : "cotizaciones" },
          { icono: <FileSignature />, valor: porDecidir, texto: "por decidir" },
          { icono: <CheckCircle2 />, valor: aceptadas, texto: aceptadas === 1 ? "aceptada" : "aceptadas" },
        ] : undefined}
      />
      {query.isPending ? (
        <ListaEsqueleto variante="cotizacion" etiqueta="Cargando cotizaciones..." />
      ) : query.isError ? (
        <ErrorBanner message="No pudimos cargar tus cotizaciones." onRetry={() => query.refetch()} />
      ) : cotizaciones.length === 0 ? (
        <EstadoVacioIlustrado
          ilustracion="cotizaciones"
          titulo="Todavía no tienes cotizaciones"
          descripcion="Cuando coticemos uno de tus pedidos, aparecerá aquí."
          accion={<Link to="/portal/solicitud" className="inline-flex items-center rounded-md bg-[#FACC15] px-4 py-2 text-sm font-bold text-[#183153] hover:bg-[#EAB308] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Crear mi primera solicitud</Link>}
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {cotizaciones.map((c, indice) => {
            const anulada = esCotizacionAnulada(c)
            const abierta = puedeDecidir(c)
            const vigencia = avisoVigencia(c)
            return (
              <li
                key={c.id}
                style={retardoEntrada(indice)}
                className={`group min-w-0 ${TARJETA_PORTAL} ${TARJETA_ELEVABLE} ${ENTRADA_TARJETA} ${abierta ? "border-t-4 border-t-[#FACC15] dark:border-t-[#FACC15]" : ""}`}
              >
                <Link
                  to={`/portal/cotizaciones/${c.id}`}
                  className="flex h-full min-w-0 flex-col gap-4 rounded-xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5"
                >
                  <span className="flex flex-wrap items-start gap-3">
                    <span aria-hidden="true" className={ICONO_TARJETA}><FileText className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">Cotización</span>
                      <span className="block truncate text-lg font-bold tabular-nums text-[#183153] dark:text-slate-50">{c.codigo}</span>
                      {c.numeroOcCliente && <span className="mt-0.5 block text-sm font-medium text-slate-600 dark:text-slate-300">OC {c.numeroOcCliente}</span>}
                    </span>
                    <EstadoBadge tono={tonoEstadoCotizacion(c.estado)}>
                      {anulada ? "Anulada" : c.estado}
                    </EstadoBadge>
                  </span>

                  <span className="grid grid-cols-1 gap-2 rounded-lg bg-[#EEF3F8] min-[420px]:grid-cols-2 px-3 py-2.5 text-sm dark:bg-white/[0.04]">
                    <span className="min-w-0">
                      <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">Emitida</span>
                      <span className="flex items-center gap-1 font-medium text-[#183153] dark:text-slate-100">
                        <CalendarDays className="h-3.5 w-3.5 text-[#2E6BA8] dark:text-[#60A5FA]" aria-hidden="true" />
                        {c.fechaCotizacion ? fechaLegible(c.fechaCotizacion) : "—"}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">Vigencia</span>
                      <span className="flex items-center gap-1 font-medium text-[#183153] dark:text-slate-100">
                        <CalendarClock className="h-3.5 w-3.5 text-[#2E6BA8] dark:text-[#60A5FA]" aria-hidden="true" />
                        {c.fechaValidez ? `Válida hasta ${fechaLegible(c.fechaValidez)}` : "Sin fecha de validez"}
                      </span>
                    </span>
                  </span>

                  {anulada && c.motivoAnulacion && (
                    <span className="block rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-muted-foreground dark:border-white/15">Motivo: {c.motivoAnulacion}</span>
                  )}

                  <span className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-3 dark:border-white/10">
                    <span>
                      <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">Total</span>
                      <span className="text-2xl font-bold tabular-nums text-[#183153] dark:text-white">{formatCurrency(Number(c.total ?? 0), c.moneda ?? "PEN")}</span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      {vigencia && (
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                          vigencia.urgente ? "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300" : "bg-[#2E6BA8]/10 text-[#1E3A5F] dark:bg-[#60A5FA]/15 dark:text-[#93C5FD]",
                        )}>
                          <vigencia.Icono className="h-3.5 w-3.5" aria-hidden="true" />{vigencia.texto}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#2E6BA8] dark:text-[#93C5FD]">
                        {abierta ? "Revisar" : "Ver detalle"}
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
