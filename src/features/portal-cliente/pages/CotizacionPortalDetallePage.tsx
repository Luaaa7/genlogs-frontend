import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Building2, CalendarClock, CalendarDays, CheckCircle2, Coins, MessageSquareText, Printer, XCircle } from "lucide-react"
import type { ReactNode } from "react"
import logoGenlogs from "@/assets/GENLOGS.webp"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import { formatCurrency } from "@/lib/formatters/currency"
import { mensajeError } from "@/lib/errores"
import { useCotizacionPortal, useDecidirCotizacion } from "../hooks/useCotizacionesPortal"
import { useCuentaPortal } from "../hooks/useCuentaPortal"
import { cantidadConUnidad, esCotizacionAnulada, estaAceptada, puedeDecidir, tonoEstadoCotizacion } from "../lib/cotizacionPortal"

const MAX_COMENTARIO = 300
const NOMBRE_MONEDA: Record<string, string> = { PEN: "Soles (PEN)", USD: "Dólares (USD)" }
const fechaLegible = (fecha: string) => new Date(`${fecha}T00:00:00`).toLocaleDateString("es-PE")

function Dato({ etiqueta, valor, icono }: { etiqueta: string; valor: string; icono: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span aria-hidden="true" className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2E6BA8] ring-1 ring-slate-200 dark:bg-white/5 dark:text-[#93C5FD] dark:ring-white/10 print:hidden [&>svg]:h-4 [&>svg]:w-4">{icono}</span>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{etiqueta}</dt>
        <dd className="mt-0.5 font-semibold text-[#183153] dark:text-slate-100 print:text-black">{valor}</dd>
      </div>
    </div>
  )
}

export function CotizacionPortalDetallePage() {
  const { id } = useParams()
  const idNumero = Number(id)
  const query = useCotizacionPortal(idNumero)
  const decidir = useDecidirCotizacion(idNumero)
  const razonSocial = useCuentaPortal().data?.empresa ?? ""
  const [comentario, setComentario] = useState("")
  const [confirmar, setConfirmar] = useState<"aprobar" | "rechazar" | null>(null)

  if (query.isPending) return <CargandoSpinner texto="Cargando cotización..." />
  if (query.isError || !query.data) return <ErrorBanner message="No pudimos cargar la cotización." onRetry={() => query.refetch()} />
  const c = query.data
  const moneda = c.moneda ?? "PEN"
  const abierta = puedeDecidir(c)

  function enviar() {
    if (!confirmar) return
    const motivo = comentario.trim() || undefined
    decidir.mutate({ decision: confirmar, motivo }, { onSettled: () => setConfirmar(null) })
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/portal/cotizaciones" className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-[#2E6BA8] hover:bg-[#EEF3F8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-[#93C5FD] dark:hover:bg-white/5 print:hidden">
          <ArrowLeft className="h-4 w-4" /> Volver a mis cotizaciones
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#1E3A5F] shadow-sm hover:border-[#2E6BA8]/50 hover:bg-[#EEF3F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:bg-white/[0.04] dark:text-[#93C5FD] dark:hover:bg-white/[0.08] print:hidden"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />Imprimir / PDF
        </button>
      </div>

      <article className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-[#1E3A5F]/5 dark:border-white/10 dark:bg-[#0F213D] dark:shadow-black/30 print:mt-0 print:overflow-visible print:rounded-none print:border-0 print:bg-white print:shadow-none">
        <div aria-hidden="true" className="h-2 bg-gradient-to-r from-[#183153] via-[#2E6BA8] to-[#183153] print:bg-[#183153]" />
        <div className="p-5 sm:p-8 print:p-0 print:pt-4">
          <div className="flex flex-col gap-5 border-b-2 border-[#132238] pb-6 dark:border-white/15 sm:flex-row sm:items-start sm:justify-between print:border-black">
            <div role="group" aria-label="Emisor" className="flex items-center gap-3">
              <img src={logoGenlogs} alt="" width={120} height={50} className="h-12 w-auto object-contain dark:brightness-0 dark:invert print:filter-none" />
              <div>
                <p className="text-lg font-bold tracking-tight text-[#132238] dark:text-foreground print:text-black">GENLOGS S.A.C.</p>
                <p className="text-sm text-muted-foreground">Soluciones para minería</p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B45309] dark:text-[#FACC15] print:text-black">Cotización</p>
              <h1 className="mt-1 text-2xl font-bold tabular-nums text-[#183153] dark:text-white sm:text-3xl print:text-black">{c.codigo}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 sm:justify-end">
                <EstadoBadge tono={tonoEstadoCotizacion(c.estado)}>
                  {esCotizacionAnulada(c) ? "Anulada" : c.estado}
                </EstadoBadge>
                {c.numeroOcCliente && <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Tu N.º de OC: {c.numeroOcCliente}</span>}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            {razonSocial && (
              <div role="group" aria-label="Cliente" className="rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10 print:border-black/30">
                <dl>
                  <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><Building2 className="h-3.5 w-3.5 print:hidden" aria-hidden="true" />Razón social</dt>
                  <dd className="mt-1 font-semibold text-[#183153] dark:text-slate-100 print:text-black">{razonSocial}</dd>
                </dl>
              </div>
            )}
            <dl role="group" aria-label="Datos de la cotización" className={`grid grid-cols-1 gap-x-6 gap-y-4 rounded-xl bg-[#EEF3F8] px-4 py-4 text-sm dark:bg-white/[0.04] sm:grid-cols-3 print:bg-transparent print:px-0 ${razonSocial ? "" : "lg:col-span-2"}`}>
              {c.fechaCotizacion && <Dato etiqueta="Fecha de emisión" valor={fechaLegible(c.fechaCotizacion)} icono={<CalendarDays />} />}
              <Dato etiqueta="Válida hasta" valor={c.fechaValidez ? fechaLegible(c.fechaValidez) : "Sin fecha de validez"} icono={<CalendarClock />} />
              <Dato etiqueta="Moneda" valor={NOMBRE_MONEDA[moneda] ?? moneda} icono={<Coins />} />
            </dl>
          </div>
          {esCotizacionAnulada(c) && c.motivoAnulacion && (
            <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm dark:border-white/15">Motivo: {c.motivoAnulacion}</p>
          )}

          {c.lineas && c.lineas.length > 0 && (
            <div className="mt-8 rounded-xl border border-slate-200 sm:overflow-x-auto dark:border-white/10 print:overflow-visible print:rounded-none print:border-black/30">
              <table className="w-full text-sm max-sm:block sm:min-w-[34rem]">
                <thead className="max-sm:sr-only bg-[#183153] text-left text-white dark:bg-[#0B1830] print:bg-transparent print:text-black">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Repuesto</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Cant.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">P. unit.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">Importe</th>
                  </tr>
                </thead>
                <tbody className="max-sm:block divide-y divide-slate-100 dark:divide-white/10 print:divide-black/20">
                  {c.lineas.map((l, i) => (
                    <tr key={i} className="max-sm:grid max-sm:grid-cols-3 max-sm:gap-x-3 max-sm:gap-y-1 max-sm:px-4 max-sm:py-3 odd:bg-white even:bg-slate-50/70 dark:odd:bg-transparent dark:even:bg-white/[0.03] print:even:bg-transparent">
                      <td className="max-sm:col-span-3 max-sm:p-0 max-sm:pb-1 px-4 py-3 font-medium text-[#183153] dark:text-slate-100 print:text-black">{l.descripcion}</td>
                      <td data-label="Cant." className="max-sm:p-0 max-sm:text-left max-sm:before:block max-sm:before:text-[10px] max-sm:before:font-semibold max-sm:before:uppercase max-sm:before:text-muted-foreground max-sm:before:content-[attr(data-label)] whitespace-nowrap px-4 py-3 text-right tabular-nums">{cantidadConUnidad(l.cantidad, l.unidad)}</td>
                      <td data-label="P. unit." className="max-sm:p-0 max-sm:before:block max-sm:before:text-[10px] max-sm:before:font-semibold max-sm:before:uppercase max-sm:before:text-muted-foreground max-sm:before:content-[attr(data-label)] whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatCurrency(Number(l.precioUnitario), moneda)}</td>
                      <td data-label="Importe" className="max-sm:p-0 max-sm:before:block max-sm:before:text-[10px] max-sm:before:font-semibold max-sm:before:uppercase max-sm:before:text-muted-foreground max-sm:before:content-[attr(data-label)] whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-[#183153] dark:text-slate-100 print:text-black">{formatCurrency(Number(l.importe), moneda)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <div className="w-full overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 sm:w-80 print:border-black/30">
              {(c.subtotal != null || c.igv != null) && (
                <div className="space-y-2 px-4 py-3 text-sm">
                  {c.subtotal != null && (
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="tabular-nums">{formatCurrency(Number(c.subtotal), moneda)}</span>
                    </div>
                  )}
                  {c.igv != null && (
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-muted-foreground">IGV</span>
                      <span className="tabular-nums">{formatCurrency(Number(c.igv), moneda)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3 bg-[#183153] px-4 py-3 text-white dark:bg-[#0B1830] print:bg-transparent print:text-black">
                <span className="text-sm font-semibold uppercase tracking-wide text-white/80 print:text-black">Total</span>
                <span className="text-2xl font-bold tabular-nums sm:text-3xl">{formatCurrency(Number(c.total ?? 0), moneda)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10 print:border-black/30">
            <p role="note" className="max-w-xl text-xs leading-relaxed text-muted-foreground">
              {c.fechaValidez ? `Oferta válida hasta el ${fechaLegible(c.fechaValidez)}. ` : "Oferta sujeta a la validez indicada por GENLOGS S.A.C. "}
              Los precios se expresan en {NOMBRE_MONEDA[moneda] ?? moneda}. Al aprobar la cotización se genera la orden de compra con las
              condiciones comerciales de este documento.
            </p>
            {estaAceptada(c) && (
              <Link to="/portal/pedidos" className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-[#2E6BA8] hover:bg-[#EEF3F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:text-[#93C5FD] dark:hover:bg-white/5 print:hidden">
                Ver mis pedidos
              </Link>
            )}
          </div>
        </div>

        {abierta && (
          <div className="border-t border-slate-200 bg-[#F8FAFC] px-5 py-6 dark:border-white/10 dark:bg-[#0B1A33] sm:px-8 print:hidden">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#183153] dark:text-slate-100">
              <MessageSquareText className="h-4 w-4 text-[#2E6BA8] dark:text-[#60A5FA]" aria-hidden="true" />
              Tu decisión
            </p>
            <label htmlFor="comentario-cotizacion" className="mt-3 block text-sm font-medium">Comentario (opcional)</label>
            <textarea
              id="comentario-cotizacion"
              value={comentario}
              maxLength={MAX_COMENTARIO}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              placeholder="Por ejemplo, el motivo si la rechazas"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:border-[#2E6BA8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:bg-[#0F213D]"
            />
            {decidir.isError && <p role="alert" className="mt-2 text-sm text-destructive">{mensajeError(decidir.error, "No se pudo registrar tu decisión.")}</p>}
            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmar("rechazar")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/15 dark:bg-transparent dark:text-slate-200 dark:hover:bg-red-500/10 dark:hover:text-red-300">
                <XCircle className="h-4 w-4" aria-hidden="true" />Rechazar
              </button>
              <button type="button" onClick={() => setConfirmar("aprobar")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2E6BA8] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#2E6BA8]/30 hover:bg-[#1E5A94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8]">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />Aprobar cotización
              </button>
            </div>
          </div>
        )}
      </article>

      <ConfirmDialog
        open={confirmar !== null}
        title={confirmar === "aprobar" ? "¿Aprobar esta cotización?" : "¿Rechazar esta cotización?"}
        description={confirmar === "aprobar"
          ? `Confirmas la compra por ${formatCurrency(Number(c.total ?? 0), moneda)}. Generaremos la orden y te avisaremos del despacho.`
          : "Le avisaremos al equipo. Si quieres, deja un comentario con el motivo antes de confirmar."}
        confirmLabel={confirmar === "aprobar" ? "Sí, aprobar" : "Sí, rechazar"}
        variant={confirmar === "aprobar" ? "default" : "destructive"}
        isLoading={decidir.isPending}
        loadingLabel={confirmar === "rechazar" ? "Rechazando..." : "Aprobando..."}
        onConfirm={enviar}
        onCancel={() => setConfirmar(null)}
      />
    </div>
  )
}
