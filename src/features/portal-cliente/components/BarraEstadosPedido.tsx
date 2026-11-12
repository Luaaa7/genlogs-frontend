import { Check } from "lucide-react"
import { ETAPAS_PEDIDO, esEstadoFinalSinCotizar, etapaDelPedido, etiquetaEstado } from "../lib/estadoPedido"

const AVISO_FINAL: Record<string, string> = {
  CANCELADA: "Si aún necesitas el repuesto, envía una nueva solicitud.",
  RECHAZADA: "Te escribimos por correo con el motivo y, si existe, una alternativa.",
}

/** Barra de seguimiento del pedido para el cliente: solo estados, sin fechas, horas ni colores de alerta (P9). */
export function BarraEstadosPedido({ estado }: { estado: string }) {
  if (esEstadoFinalSinCotizar(estado)) {
    return (
      <p role="status" className="rounded-lg border border-border bg-muted px-4 py-3 text-sm">
        <span className="font-semibold">{etiquetaEstado(estado)}.</span>{" "}
        {AVISO_FINAL[estado]}
      </p>
    )
  }

  const actual = etapaDelPedido(estado)
  return (
    <ol aria-label="Avance del pedido" className="grid grid-cols-4 gap-2">
      {ETAPAS_PEDIDO.map((etapa, i) => {
        const completada = i < actual
        const enCurso = i === actual
        return (
          <li key={etapa.estado} aria-current={enCurso ? "step" : undefined} className="flex flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? "invisible" : completada || enCurso ? "bg-primary" : "bg-border"}`} />
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                  completada ? "border-primary bg-primary text-primary-foreground"
                    : enCurso ? "border-primary bg-background text-primary"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {completada ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </span>
              <span className={`h-0.5 flex-1 ${i === ETAPAS_PEDIDO.length - 1 ? "invisible" : completada ? "bg-primary" : "bg-border"}`} />
            </div>
            <span className={`mt-2 text-xs sm:text-sm ${enCurso ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {etapa.etiqueta}
            </span>
            <span className="sr-only">{completada ? "(completada)" : enCurso ? "(en curso)" : "(pendiente)"}</span>
          </li>
        )
      })}
    </ol>
  )
}
