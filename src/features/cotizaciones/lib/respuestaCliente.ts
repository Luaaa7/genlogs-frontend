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
