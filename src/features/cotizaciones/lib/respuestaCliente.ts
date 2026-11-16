import { parsearFechaLocal } from "@/lib/formatters/fechaLocal"
import type { AdjuntoCotizacion, SeguimientoCotizacion } from "@/types/cotizacion.types"

/** yyyy-mm-dd en America/Lima, sin pasar la fecha por `new Date('yyyy-mm-dd')`. */
function diaEnLima(fecha: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha)
}

const ESTADOS_CON_RESPUESTA = new Set(["ENVIADA", "EN_NEGOCIACION"])

/** El día de validez inclusive sigue abierto. Sin fecha, el backend también deja registrar. */
export function cotizacionSigueVigente(fechaValidez: string | null | undefined, hoy: Date = new Date()): boolean {
  if (!fechaValidez) return true
  return diaEnLima(hoy) <= fechaValidez.slice(0, 10)
}

/** Solo el Jefe, en enviada o en negociación, y mientras la vigencia no haya pasado. */
export function puedeRegistrarRespuestaCliente(
  esJefe: boolean,
  estado: string,
  fechaValidez: string | null | undefined,
  hoy: Date = new Date(),
): boolean {
  return esJefe && ESTADOS_CON_RESPUESTA.has(estado) && cotizacionSigueVigente(fechaValidez, hoy)
}

function codigoDe(estado: string | null | undefined): string {
  return (estado ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
}

function enMilisegundos(valor: string | null | undefined): number | null {
  if (!valor) return null
  const fecha = parsearFechaLocal(valor)
  return fecha ? fecha.getTime() : null
}

/** El seguimiento ENVIADA más antiguo. Un segundo envío no mueve esta fecha. */
export function fechaDelPrimerEnvio(
  seguimientos: Pick<SeguimientoCotizacion, "estadoNuevo" | "fechaEvento">[],
): number | null {
  let corte: number | null = null
  for (const seguimiento of seguimientos) {
    if (codigoDe(seguimiento.estadoNuevo) !== "ENVIADA") continue
    const momento = enMilisegundos(seguimiento.fechaEvento)
    if (momento == null) continue
    if (corte == null || momento < corte) corte = momento
  }
  return corte
}

/**
 * Adjuntos que el Jefe puede usar como correo u orden de compra: fechaSubida
 * estrictamente posterior al primer paso a ENVIADA. Sin ese seguimiento, sin
 * fechaSubida, o con fecha anterior o igual, el archivo no entra.
 */
export function adjuntosDeLaRespuesta(
  adjuntos: AdjuntoCotizacion[],
  seguimientos: Pick<SeguimientoCotizacion, "estadoNuevo" | "fechaEvento">[],
): AdjuntoCotizacion[] {
  const corte = fechaDelPrimerEnvio(seguimientos)
  if (corte == null) return []
  return adjuntos.filter((adjunto) => {
    const subida = enMilisegundos(adjunto.fechaSubida)
    return subida != null && subida > corte
  })
}
