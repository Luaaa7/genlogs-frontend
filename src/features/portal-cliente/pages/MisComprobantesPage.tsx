import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { CalendarClock, CalendarDays, CheckCircle2, CreditCard, Info, Loader2, Receipt, Wallet } from "lucide-react"
import { portalComprobantesApi, type ComprobantePortal } from "@/api/portalComprobantesApi"
import { Button } from "@/components/ui/button"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { formatearMoneda } from "@/lib/formatters/codigoCotizacion"
import { formatearFechaCorta } from "@/lib/formatters/fechaLocal"
import { mensajeError } from "@/lib/errores"
import { EncabezadoPortal } from "../components/EncabezadoPortal"
import { EstadoVacioIlustrado } from "../components/EstadoVacioIlustrado"
import { ListaEsqueleto } from "../components/SkeletonCard"
import { ENTRADA_TARJETA, ICONO_TARJETA, TARJETA_ELEVABLE, TARJETA_PORTAL, retardoEntrada } from "../lib/estilosTarjeta"
import { navegacionExterna } from "../lib/navegacionExterna"

function tono(codigo?: string | null) {
  const c = (codigo ?? "").toUpperCase()
  if (c === "PAGADA") return "success" as const
  if (c === "ANULADA" || c === "VENCIDA") return "destructive" as const
  if (c === "PARCIAL") return "warning" as const
  return "info" as const
}

/** Mis comprobantes (BPMN 4.1): el cliente ve sus facturas y paga el saldo con Mercado Pago. */
export function MisComprobantesPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["portal", "comprobantes"],
    queryFn: portalComprobantesApi.listar,
  })
  const [pagandoId, setPagandoId] = useState<number | null>(null)
  const [errorPago, setErrorPago] = useState<string | null>(null)

  const pagar = useMutation({
    mutationFn: (id: number) => portalComprobantesApi.pagar(id),
    onSuccess: ({ urlPago }) => navegacionExterna.ir(urlPago),
    onError: (e) => {
      setPagandoId(null)
      setErrorPago(mensajeError(e, "No se pudo iniciar el pago. Inténtalo de nuevo."))
    },
  })

  const iniciar = (c: ComprobantePortal) => {
    setErrorPago(null)
    setPagandoId(c.id)
    pagar.mutate(c.id)
  }

  const comprobantes = data ?? []
  const conSaldo = comprobantes.filter((c) => Number(c.saldoPendiente) > 0).length
  const pagados = comprobantes.length - conSaldo

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPortal
        titulo="Mis comprobantes"
        descripcion="Tus facturas y lo que falta pagar. Los comprobantes en soles se pueden pagar en línea con Mercado Pago."
        ilustracion="comprobantes"
        resumen={comprobantes.length > 0 ? [
          { icono: <Receipt />, valor: comprobantes.length, texto: comprobantes.length === 1 ? "comprobante" : "comprobantes" },
          { icono: <Wallet />, valor: conSaldo, texto: "con saldo pendiente" },
          { icono: <CheckCircle2 />, valor: pagados, texto: "sin saldo" },
        ] : undefined}
      />

      {errorPago && <ErrorBanner message={errorPago} />}
      {isError && <ErrorBanner message="No se pudieron cargar tus comprobantes." error={error} onRetry={() => refetch()} />}

      {isLoading ? (
        <ListaEsqueleto variante="comprobante" etiqueta="Cargando comprobantes..." />
      ) : !isError && comprobantes.length === 0 ? (
        <EstadoVacioIlustrado
          ilustracion="comprobantes"
          titulo="Todavía no tienes comprobantes"
          descripcion="Cuando GENLOGS emita una factura de tus pedidos, aparecerá aquí."
        />
      ) : (
        <ul className="grid gap-4">
          {comprobantes.map((c, indice) => {
            const ocupado = pagar.isPending && pagandoId === c.id
            const saldo = Number(c.saldoPendiente)
            const total = Number(c.total)
            const sinSaldo = saldo <= 0
            const pagadoPct = total > 0 ? Math.min(100, Math.max(0, Math.round((Number(c.montoPagado) / total) * 100))) : 0
            return (
              <li key={c.id} style={retardoEntrada(indice)} className={`group p-4 sm:p-6 ${TARJETA_PORTAL} ${TARJETA_ELEVABLE} ${ENTRADA_TARJETA}`}>
                <div className="flex items-start gap-3 sm:gap-4">
                  <span aria-hidden="true" className={ICONO_TARJETA}><Receipt className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {c.tipo ?? "Comprobante"}{c.numeroOcCliente && <> · OC {c.numeroOcCliente}</>}
                        </p>
                        <p className="mt-0.5 text-lg font-bold tabular-nums text-[#183153] dark:text-slate-50">{c.comprobante}</p>
                      </div>
                      {c.estado && <EstadoBadge tono={tono(c.codigoEstado)}>{c.estado}</EstadoBadge>}
                    </div>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  <div className="rounded-lg bg-[#EEF3F8] px-3 py-2.5 dark:bg-white/[0.04]">
                    <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />Emisión</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums text-[#183153] dark:text-slate-100">{c.fechaEmision ? formatearFechaCorta(c.fechaEmision) : "—"}</dd>
                  </div>
                  <div className="rounded-lg bg-[#EEF3F8] px-3 py-2.5 dark:bg-white/[0.04]">
                    <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />Vencimiento</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums text-[#183153] dark:text-slate-100">{c.fechaVencimiento ? formatearFechaCorta(c.fechaVencimiento) : "—"}</dd>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-2.5 dark:border-white/10">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Total</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums text-[#183153] dark:text-slate-100">{formatearMoneda(c.total, c.moneda)}</dd>
                  </div>
                  <div className={sinSaldo
                    ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-400/20 dark:bg-emerald-400/10"
                    : "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-400/25 dark:bg-amber-400/10"}>
                    <dt className={`text-[11px] font-semibold uppercase tracking-wide ${sinSaldo ? "text-emerald-700 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"}`}>Saldo pendiente</dt>
                    <dd className={`mt-0.5 text-lg font-bold tabular-nums ${sinSaldo ? "text-emerald-800 dark:text-emerald-200" : "text-amber-900 dark:text-amber-200"}`}>{formatearMoneda(c.saldoPendiente, c.moneda)}</dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Pagado: <span className="font-semibold tabular-nums text-[#183153] dark:text-slate-200">{formatearMoneda(c.montoPagado, c.moneda)}</span></span>
                    <span className="tabular-nums">{pagadoPct}%</span>
                  </div>
                  <div aria-hidden="true" className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div className={`h-full rounded-full ${sinSaldo ? "bg-emerald-500" : "bg-[#2E6BA8] dark:bg-[#3B82F6]"}`} style={{ width: `${pagadoPct}%` }} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
                  {c.puedePagarEnLinea ? (
                    <Button onClick={() => iniciar(c)} disabled={pagar.isPending} className="rounded-lg bg-[#2E6BA8] font-semibold text-white shadow-md shadow-[#2E6BA8]/30 hover:bg-[#1E5A94] dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8]">
                      {ocupado
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        : <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />}
                      {ocupado ? "Abriendo Mercado Pago…" : "Pagar en línea"}
                    </Button>
                  ) : (
                    c.motivoSinPago && (
                      <p className="mr-auto flex items-start gap-1.5 text-sm text-muted-foreground">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#2E6BA8] dark:text-[#60A5FA]" aria-hidden="true" />
                        {c.motivoSinPago}
                      </p>
                    )
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
