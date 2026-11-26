import { ETAPAS_PEDIDO, esEstadoFinalSinCotizar, etapaDelPedido } from "../lib/estadoPedido"

/**
 * Barra compacta de 4 etapas para la tarjeta del pedido (Recibida, En búsqueda, En espera de proveedor,
 * Cotizada). Solo estados, sin fechas ni colores de alerta (P9). Un pedido cancelado o que no se pudo
 * cotizar no la muestra: su estado ya está en la insignia.
 */
export function ProgresoPedido({ estado, etiqueta, className = "" }: { estado: string; etiqueta: string; className?: string }) {
  if (esEstadoFinalSinCotizar(estado)) return null
  const actual = etapaDelPedido(estado)
  return (
    <ol aria-label={etiqueta} className={`grid grid-cols-4 gap-1.5 ${className}`}>
      {ETAPAS_PEDIDO.map((etapa, i) => {
        const completada = i < actual
        const enCurso = i === actual
        return (
          <li key={etapa.estado} aria-current={enCurso ? "step" : undefined} className="min-w-0">
            <div
              aria-hidden="true"
              className={`h-1.5 rounded-full ${completada ? "bg-[#183153] dark:bg-primary" : enCurso ? "bg-accent" : "bg-slate-200 dark:bg-muted"}`}
            />
            <span className={`mt-1.5 block text-xs leading-tight ${enCurso ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {etapa.etiqueta}
            </span>
            <span className="sr-only">{completada ? "(completada)" : enCurso ? "(en curso)" : "(pendiente)"}</span>
          </li>
        )
      })}
    </ol>
  )
}
