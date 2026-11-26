import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { CreditCard, Loader2, Receipt } from "lucide-react"
import { portalComprobantesApi, type ComprobantePortal } from "@/api/portalComprobantesApi"
import { Button } from "@/components/ui/button"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import { EstadoVacio } from "@/components/ui/EstadoVacio"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { formatearMoneda } from "@/lib/formatters/codigoCotizacion"
import { formatearFechaCorta } from "@/lib/formatters/fechaLocal"
import { mensajeError } from "@/lib/errores"
import { ListaEsqueleto } from "../components/SkeletonCard"
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mis comprobantes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tus facturas y lo que falta pagar. Los comprobantes en soles se pueden pagar en línea con Mercado Pago.
        </p>
      </div>

      {errorPago && <ErrorBanner message={errorPago} />}
      {isError && <ErrorBanner message="No se pudieron cargar tus comprobantes." error={error} onRetry={() => refetch()} />}

      {isLoading ? (
        <ListaEsqueleto variante="comprobante" etiqueta="Cargando comprobantes..." />
      ) : !isError && comprobantes.length === 0 ? (
        <EstadoVacio
          icono={<Receipt className="h-5 w-5" />}
          titulo="Todavía no tienes comprobantes"
          descripcion="Cuando GENLOGS emita una factura de tus pedidos, aparecerá aquí."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {comprobantes.map((c) => {
            const ocupado = pagar.isPending && pagandoId === c.id
            return (
              <li key={c.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold tabular-nums">{c.comprobante}</p>
                      {c.estado && <EstadoBadge tono={tono(c.codigoEstado)}>{c.estado}</EstadoBadge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.tipo ?? "Comprobante"}
                      {c.fechaEmision && <> · emitido el {formatearFechaCorta(c.fechaEmision)}</>}
                      {c.fechaVencimiento && <> · vence el {formatearFechaCorta(c.fechaVencimiento)}</>}
                      {c.numeroOcCliente && <> · OC {c.numeroOcCliente}</>}
                    </p>
                  </div>
                  <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-right text-sm">
                    <dt className="text-muted-foreground">Total</dt>
                    <dd className="tabular-nums">{formatearMoneda(c.total, c.moneda)}</dd>
                    <dt className="text-muted-foreground">Saldo</dt>
                    <dd className="font-semibold tabular-nums">{formatearMoneda(c.saldoPendiente, c.moneda)}</dd>
                  </dl>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-3">
                  {c.puedePagarEnLinea ? (
                    <Button onClick={() => iniciar(c)} disabled={pagar.isPending}>
                      {ocupado
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        : <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />}
                      {ocupado ? "Abriendo Mercado Pago…" : "Pagar en línea"}
                    </Button>
                  ) : (
                    c.motivoSinPago && <p className="text-sm text-muted-foreground">{c.motivoSinPago}</p>
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