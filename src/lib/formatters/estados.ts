import type { EstadoBadgeTono } from "@/components/ui/EstadoBadge"

/** Etiqueta y tono de EstadoBadge para los estados de órdenes y comprobantes. */
interface Estado { label: string; tono: EstadoBadgeTono }

export const ESTADOS_ORDEN: Record<string, Estado> = {
  RECIBIDA: { label: "Recibida", tono: "info" },
  EN_ATENCION: { label: "En atención", tono: "accent" },
  ATENDIDA: { label: "Atendida", tono: "success" },
  ANULADA: { label: "Anulada", tono: "neutral" },
}

export const ESTADOS_FACTURA: Record<string, Estado> = {
  EMITIDA: { label: "Emitida", tono: "info" },
  PARCIAL: { label: "Pago parcial", tono: "warning" },
  PAGADA: { label: "Pagada", tono: "success" },
  VENCIDA: { label: "Vencida", tono: "destructive" },
  ANULADA: { label: "Anulada", tono: "neutral" },
}

export const ESTADOS_RECLAMO: Record<string, Estado> = {
  REGISTRADO: { label: "Registrado", tono: "info" },
  EN_PROCESO: { label: "En proceso", tono: "accent" },
  RESUELTO: { label: "Resuelto", tono: "success" },
  CERRADO: { label: "Cerrado", tono: "neutral" },
  ANULADO: { label: "Anulado", tono: "neutral" },
}

export const PRIORIDADES_RECLAMO: Record<string, Estado> = {
  BAJA: { label: "Baja", tono: "neutral" },
  MEDIA: { label: "Media", tono: "info" },
  ALTA: { label: "Alta", tono: "warning" },
  CRITICA: { label: "Crítica", tono: "destructive" },
}

export const TIPOS_RECLAMO: Record<string, string> = {
  RECLAMO: "Reclamo",
  INCIDENCIA: "Incidencia",
}

export const TIPOS_COMPROBANTE: Record<string, string> = {
  FACTURA: "Factura",
  BOLETA: "Boleta",
  NOTA_CREDITO: "Nota de crédito",
  NOTA_DEBITO: "Nota de débito",
}

export function estadoDe(mapa: Record<string, Estado>, codigo?: string | null): Estado {
  return (codigo && mapa[codigo]) || { label: codigo ?? "—", tono: "neutral" }
}
