import type { EstadoBadgeTono } from "@/components/ui/EstadoBadge"

const ETIQUETAS: Record<string, string> = {
  REGISTRADO: "Registrado",
  EN_PROCESO: "En proceso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
  ANULADO: "Anulado",
}

export function etiquetaEstadoReclamo(estado: string): string {
  return ETIQUETAS[estado] ?? estado
}

export function tonoEstadoReclamo(estado: string): EstadoBadgeTono {
  if (estado === "RESUELTO" || estado === "CERRADO") return "success"
  if (estado === "ANULADO") return "neutral"
  return "warning"
}

export function fechaCorta(iso?: string): string {
  if (!iso) return ""
  const fecha = new Date(iso)
  return Number.isNaN(fecha.getTime()) ? "" : fecha.toLocaleDateString("es-PE")
}

/** Etapas del reclamo, en el orden en que avanzan. ANULADO no está: termina sin seguimiento. */
export const ETAPAS_RECLAMO = ["REGISTRADO", "EN_PROCESO", "RESUELTO", "CERRADO"] as const

/** Índice de la etapa del reclamo; -1 si está anulado o el estado no se conoce. */
export function etapaDelReclamo(estado: string): number {
  return (ETAPAS_RECLAMO as readonly string[]).indexOf(estado)
}
