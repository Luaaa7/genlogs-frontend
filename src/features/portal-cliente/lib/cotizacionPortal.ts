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
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim()
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
  if (e.startsWith("APROBADA") || e.startsWith("ACEPTADA")) return "success"
  if (e.startsWith("RECHAZADA") || e.startsWith("ANULADA")) return "destructive"
  if (e.startsWith("VENCIDA")) return "neutral"
  return "warning"
}

/** La cotización ya fue aprobada o aceptada (por código o por el nombre del estado). */
export function estaAceptada(cotizacion: Pick<CotizacionPortal, "estado" | "codigoEstado">): boolean {
  const codigo = (cotizacion.codigoEstado ?? "").toUpperCase()
  if (codigo === "APROBADA" || codigo === "ACEPTADA") return true
  const e = normalizar(cotizacion.estado ?? "")
  return e.startsWith("APROBADA") || e.startsWith("ACEPTADA")
}

const ABREVIATURAS = new Set(["und", "pza", "pzs", "mts", "lts", "gln", "jgo", "kgs", "glb", "cja", "rll"])

/** «UND», «kg», «und.», «m»: abreviaturas que no se pluralizan. «Par» y «Juego» sí son palabras. */
function esAbreviatura(unidad: string): boolean {
  return unidad.length <= 2 || unidad.includes(".") || (unidad === unidad.toUpperCase() && unidad.length <= 4) || ABREVIATURAS.has(unidad.toLowerCase())
}

function pluralDe(palabra: string): string {
  const mayusculas = palabra === palabra.toUpperCase()
  const sufijo = (texto: string) => (mayusculas ? texto.toUpperCase() : texto)
  const minus = palabra.toLowerCase()
  if (minus.endsWith("ón")) return palabra.slice(0, -2) + sufijo("ones")
  if (/[sx]$/.test(minus)) return palabra
  if (minus.endsWith("z")) return palabra.slice(0, -1) + sufijo("ces")
  if (/[aeiouáéíóú]$/.test(minus)) return palabra + sufijo("s")
  return palabra + sufijo("es")
}

/**
 * «1 Unidad», «2 Unidades», «60 Unidades». Las abreviaturas («UND», «kg», «und.») no se tocan; si la unidad
 * tiene varias palabras («Juego de llaves») solo la primera cambia. Sin unidad, solo la cantidad.
 */
export function cantidadConUnidad(cantidad: number, unidad?: string | null): string {
  const limpia = unidad?.trim()
  if (!limpia) return String(cantidad)
  if (cantidad === 1 || esAbreviatura(limpia)) return `${cantidad} ${limpia}`
  const [primera, ...resto] = limpia.split(/\s+/)
  return [String(cantidad), pluralDe(primera), ...resto].join(" ")
}
