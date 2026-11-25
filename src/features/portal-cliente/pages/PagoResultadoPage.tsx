import { useEffect, useRef, type ReactNode } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react"
import { portalComprobantesApi, type ResultadoPago } from "@/api/portalComprobantesApi"
import { Button } from "@/components/ui/button"
import { formatearMoneda } from "@/lib/formatters/codigoCotizacion"
import { mensajeError } from "@/lib/errores"

/**
 * Regreso del checkout de Mercado Pago (BPMN 4.1). Mercado Pago agrega payment_id a la URL;
 * el backend consulta ese pago a Mercado Pago y registra el cobro si está aprobado.
 * La URL no decide nada: solo dice qué pago revisar.
 */
export function PagoResultadoPage() {
  const [params] = useSearchParams()
  const idPago = params.get("payment_id") ?? params.get("collection_id")
  const valido = !!idPago && /^\d{1,30}$/.test(idPago)
  const confirmar = useMutation({ mutationFn: (id: string) => portalComprobantesApi.confirmar(id) })
  const enviado = useRef(false)

  useEffect(() => {
    // Una sola verificación aunque React monte el efecto dos veces.
    if (!valido || enviado.current) return
    enviado.current = true
    confirmar.mutate(idPago as string)
  }, [valido, idPago, confirmar])

  let contenido
  if (!valido) {
    contenido = (
      <Mensaje icono="error" titulo="El pago no se completó">
        No se hizo ningún cobro. Puedes volver a intentarlo desde tus comprobantes.
      </Mensaje>
    )
  } else if (confirmar.isPending || confirmar.isIdle) {
    contenido = (
      <div role="status" className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        Estamos confirmando tu pago con Mercado Pago…
      </div>
    )
  } else if (confirmar.isError) {
    contenido = (
      <Mensaje icono="espera" titulo="No pudimos confirmar el pago todavía">
        {mensajeError(confirmar.error, "Inténtalo de nuevo en unos minutos.")} Si ya pagaste, no vuelvas a pagar:
        lo registraremos apenas Mercado Pago lo confirme.
      </Mensaje>
    )
  } else {
    contenido = <Resultado resultado={confirmar.data} />
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Pago del comprobante</h1>
      <div className="rounded-xl border border-border bg-card p-5">{contenido}</div>
      <div>
        <Button variant="outline" asChild>
          <Link to="/portal/comprobantes">Volver a mis comprobantes</Link>
        </Button>
      </div>
    </div>
  )
}

function Resultado({ resultado }: { resultado: ResultadoPago }) {
  const icono = resultado.estado === "REGISTRADO" || resultado.estado === "YA_REGISTRADO"
    ? "ok"
    : resultado.estado === "PENDIENTE" || resultado.estado === "REVISION"
      ? "espera"
      : "error"
  const titulo = icono === "ok" ? "Pago recibido" : icono === "espera" ? "Pago en revisión" : "El pago no se completó"
  return (
    <Mensaje icono={icono} titulo={titulo}>
      {resultado.mensaje}
      {icono === "ok" && resultado.saldoPendiente != null && (
        <span className="mt-2 block font-medium text-foreground">
          Saldo pendiente: {formatearMoneda(resultado.saldoPendiente, "PEN")}
        </span>
      )}
    </Mensaje>
  )
}

function Mensaje({ icono, titulo, children }: { icono: "ok" | "espera" | "error"; titulo: string; children: ReactNode }) {
  const Icono = icono === "ok" ? CheckCircle2 : icono === "espera" ? Clock : XCircle
  const color = icono === "ok" ? "text-success" : icono === "espera" ? "text-warning" : "text-destructive"
  return (
    <div role="status" className="flex items-start gap-3">
      <Icono className={`mt-0.5 h-6 w-6 shrink-0 ${color}`} aria-hidden="true" />
      <div>
        <p className="font-semibold">{titulo}</p>
        <p className="mt-1 text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}