import type { EstadoBadgeTono } from "@/components/ui/EstadoBadge"
import type { CotizacionPortal } from "@/api/portalCotizacionesApi"

const CODIGOS_ABIERTOS = new Set(["ENVIADA", "EN_NEGOCIACION"])

/** yyyy-mm-dd en America/Lima, sin pasar la fecha por `new Date('yyyy-mm-dd')`. */
function diaEnLima(fecha: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha)
}

/** Quita tildes y pasa a mayúsculas para comparar nombres de estado ("En negociación" → "EN NEGOCIACION"). */
function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim()
}

/**
 * ¿El cliente todavía puede aprobar o rechazar? Si el API manda puedeDecidir, se usa tal cual.
 * Si no viene, solo ENVIADA o EN_NEGOCIACION, y el día de validez inclusive: cierra a las
 * 00:00 de America/Lima del día siguiente a fechaValidez.
 */
export function puedeDecidir(
  cotizacion: Pick<CotizacionPortal, "estado" | "codigoEstado" | "puedeDecidir" | "fechaValidez">,
  hoy: Date = new Date(),
): boolean {
  if (typeof cotizacion.puedeDecidir === "boolean") return cotizacion.puedeDecidir
  if (cotizacion.fechaValidez && diaEnLima(hoy) > cotizacion.fechaValidez) return false
  const codigo = cotizacion.codigoEstado ?? normalizar(cotizacion.estado ?? "").replace(/ /g, "_")
  return CODIGOS_ABIERTOS.has(codigo)
}

/** ANULADA por código o por el nombre que muestra el portal ("Anulada"). */
export function esCotizacionAnulada(
  cotizacion: Pick<CotizacionPortal, "estado" | "codigoEstado">,
): boolean {
  if ((cotizacion.codigoEstado ?? "").toUpperCase() === "ANULADA") return true
  return normalizar(cotizacion.estado ?? "") === "ANULADA"
}

export function tonoEstadoCotizacion(estado: string): EstadoBadgeTono {
  const e = normalizar(estado ?? "")
  if (e.startsWith("APROBADA")) return "success"
  if (e.startsWith("RECHAZADA") || e.startsWith("ANULADA")) return "destructive"
  if (e.startsWith("VENCIDA")) return "neutral"
  return "warning"
}
