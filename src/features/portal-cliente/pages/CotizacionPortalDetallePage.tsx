import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, CheckCircle2, Printer, XCircle } from "lucide-react"
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

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-0.5 font-medium">{valor}</dd>
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
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/portal/cotizaciones" className="inline-flex items-center gap-2 text-sm text-accent hover:underline print:hidden">
          <ArrowLeft className="h-4 w-4" /> Volver a mis cotizaciones
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />Imprimir / PDF
        </button>
      </div>
      <div className="mt-4 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8 print:mt-0 print:border-0 print:p-0 print:shadow-none">
        <div className="grid gap-4 border-b-2 border-[#132238] pb-5 dark:border-border sm:grid-cols-2 print:border-black">
          <div role="group" aria-label="Emisor">
            <p className="text-lg font-bold tracking-tight text-[#132238] dark:text-foreground print:text-black">GENLOGS S.A.C.</p>
            <p className="text-sm text-muted-foreground">Soluciones para minería</p>
          </div>
          {razonSocial && (
            <div role="group" aria-label="Cliente" className="sm:text-right">
              <dl>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Razón social</dt>
                <dd className="mt-0.5 font-semibold">{razonSocial}</dd>
              </dl>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Cotización</p>
            <h1 className="mt-1 text-3xl font-bold">{c.codigo}</h1>
            {c.numeroOcCliente && <p className="mt-1 text-sm font-medium">Tu N.º de OC: {c.numeroOcCliente}</p>}
          </div>
          <EstadoBadge tono={tonoEstadoCotizacion(c.estado)}>
            {esCotizacionAnulada(c) ? "Anulada" : c.estado}
          </EstadoBadge>
        </div>
        <dl role="group" aria-label="Datos de la cotización" className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg bg-[#EEF3F8] px-4 py-4 text-sm dark:bg-muted/40 sm:grid-cols-3 print:bg-transparent print:px-0">
          {c.fechaCotizacion && <Dato etiqueta="Fecha de emisión" valor={fechaLegible(c.fechaCotizacion)} />}
          <Dato etiqueta="Válida hasta" valor={c.fechaValidez ? fechaLegible(c.fechaValidez) : "Sin fecha de validez"} />
          <Dato etiqueta="Moneda" valor={NOMBRE_MONEDA[moneda] ?? moneda} />
        </dl>
        {esCotizacionAnulada(c) && c.motivoAnulacion && (
          <p className="mt-4 text-sm">Motivo: {c.motivoAnulacion}</p>
        )}

        {c.lineas && c.lineas.length > 0 && (
          <table className="mt-8 w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="py-2 font-medium">Repuesto</th><th className="py-2 text-right font-medium">Cant.</th><th className="py-2 text-right font-medium">P. unit.</th><th className="py-2 text-right font-medium">Importe</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {c.lineas.map((l, i) => (
                <tr key={i}>
                  <td className="py-3">{l.descripcion}</td>
                  <td className="py-3 text-right tabular-nums">{cantidadConUnidad(l.cantidad, l.unidad)}</td>
                  <td className="py-3 text-right tabular-nums">{formatCurrency(Number(l.precioUnitario), moneda)}</td>
                  <td className="py-3 text-right tabular-nums">{formatCurrency(Number(l.importe), moneda)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="mt-6 space-y-2 border-t border-border pt-4 text-right">
          {c.subtotal != null && (
            <div className="flex items-baseline justify-end gap-3">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(Number(c.subtotal), moneda)}</span>
            </div>
          )}
          {c.igv != null && (
            <div className="flex items-baseline justify-end gap-3">
              <span className="text-muted-foreground">IGV</span>
              <span className="tabular-nums">{formatCurrency(Number(c.igv), moneda)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-end gap-3">
            <span className="text-muted-foreground">Total</span>
            <span className="text-3xl font-bold tabular-nums">{formatCurrency(Number(c.total ?? 0), moneda)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p role="note" className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            {c.fechaValidez ? `Oferta válida hasta el ${fechaLegible(c.fechaValidez)}. ` : "Oferta sujeta a la validez indicada por GENLOGS S.A.C. "}
            Los precios se expresan en {NOMBRE_MONEDA[moneda] ?? moneda}. Al aprobar la cotización se genera la orden de compra con las
            condiciones comerciales de este documento.
          </p>
          {estaAceptada(c) && (
            <Link to="/portal/pedidos" className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium text-accent hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring print:hidden">
              Ver mis pedidos
            </Link>
          )}
        </div>

        {abierta && (
          <div className="mt-8 border-t border-border pt-6 print:hidden">
            <label htmlFor="comentario-cotizacion" className="text-sm font-medium">Comentario (opcional)</label>
            <textarea
              id="comentario-cotizacion"
              value={comentario}
              maxLength={MAX_COMENTARIO}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              placeholder="Por ejemplo, el motivo si la rechazas"
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {decidir.isError && <p role="alert" className="mt-2 text-sm text-destructive">{mensajeError(decidir.error, "No se pudo registrar tu decisión.")}</p>}
            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => setConfirmar("rechazar")} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <XCircle className="h-4 w-4" aria-hidden="true" />Rechazar
              </button>
              <button type="button" onClick={() => setConfirmar("aprobar")} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />Aprobar cotización
              </button>
            </div>
          </div>
        )}
      </div>

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
