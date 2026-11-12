import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import { formatCurrency } from "@/lib/formatters/currency"
import { mensajeError } from "@/lib/errores"
import { useCotizacionPortal, useDecidirCotizacion } from "../hooks/useCotizacionesPortal"
import { puedeDecidir, tonoEstadoCotizacion } from "../lib/cotizacionPortal"

const MAX_COMENTARIO = 300

export function CotizacionPortalDetallePage() {
  const { id } = useParams()
  const idNumero = Number(id)
  const query = useCotizacionPortal(idNumero)
  const decidir = useDecidirCotizacion(idNumero)
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
      <Link to="/portal/cotizaciones" className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
        <ArrowLeft className="h-4 w-4" /> Volver a mis cotizaciones
      </Link>
      <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Cotización</p>
            <h1 className="mt-1 text-3xl font-bold">{c.codigo}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {c.fechaValidez ? `Válida hasta ${new Date(`${c.fechaValidez}T00:00:00`).toLocaleDateString("es-PE")}` : "Sin fecha de validez"}
            </p>
            {c.numeroOcCliente && <p className="mt-1 text-sm font-medium">Tu N.º de OC: {c.numeroOcCliente}</p>}
          </div>
          <EstadoBadge tono={tonoEstadoCotizacion(c.estado)}>{c.estado}</EstadoBadge>
        </div>

        {c.lineas && c.lineas.length > 0 && (
          <table className="mt-8 w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="py-2 font-medium">Repuesto</th><th className="py-2 text-right font-medium">Cant.</th><th className="py-2 text-right font-medium">P. unit.</th><th className="py-2 text-right font-medium">Importe</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {c.lineas.map((l, i) => (
                <tr key={i}>
                  <td className="py-3">{l.descripcion}</td>
                  <td className="py-3 text-right tabular-nums">{l.cantidad} {l.unidad ?? ""}</td>
                  <td className="py-3 text-right tabular-nums">{formatCurrency(Number(l.precioUnitario), moneda)}</td>
                  <td className="py-3 text-right tabular-nums">{formatCurrency(Number(l.importe), moneda)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="mt-6 flex items-baseline justify-end gap-3 border-t border-border pt-4">
          <span className="text-muted-foreground">Total</span>
          <span className="text-3xl font-bold tabular-nums">{formatCurrency(Number(c.total ?? 0), moneda)}</span>
        </div>

        {abierta && (
          <div className="mt-8 border-t border-border pt-6">
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
        onConfirm={enviar}
        onCancel={() => setConfirmar(null)}
      />
    </div>
  )
}
