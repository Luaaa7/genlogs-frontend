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
