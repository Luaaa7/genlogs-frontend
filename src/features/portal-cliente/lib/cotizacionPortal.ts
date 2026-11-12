import type { EstadoBadgeTono } from "@/components/ui/EstadoBadge"
import type { CotizacionPortal } from "@/api/portalCotizacionesApi"

const CODIGOS_ABIERTOS = new Set(["ENVIADA", "EN_NEGOCIACION"])

/** Quita tildes y pasa a mayúsculas para comparar nombres de estado ("En negociación" → "EN NEGOCIACION"). */
function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim()
}

/**
 * ¿El cliente todavía puede aprobar o rechazar? Igual que el backend (BE-C): solo ENVIADA o
 * EN_NEGOCIACION y dentro de la fecha de validez. Si el backend manda puedeDecidir o el código
 * del estado, se usan esos; si no, se compara el nombre.
 */
export function puedeDecidir(
  cotizacion: Pick<CotizacionPortal, "estado" | "codigoEstado" | "puedeDecidir" | "fechaValidez">,
  hoy: Date = new Date(),
): boolean {
  if (typeof cotizacion.puedeDecidir === "boolean") return cotizacion.puedeDecidir
  if (cotizacion.fechaValidez) {
    const finDelDia = new Date(`${cotizacion.fechaValidez}T23:59:59`)
    if (finDelDia < hoy) return false
  }
  const codigo = cotizacion.codigoEstado ?? normalizar(cotizacion.estado ?? "").replace(/ /g, "_")
  return CODIGOS_ABIERTOS.has(codigo)
}

export function tonoEstadoCotizacion(estado: string): EstadoBadgeTono {
  const e = normalizar(estado ?? "")
  if (e.startsWith("APROBADA")) return "success"
  if (e.startsWith("RECHAZADA") || e.startsWith("ANULADA")) return "destructive"
  if (e.startsWith("VENCIDA")) return "neutral"
  return "warning"
}
