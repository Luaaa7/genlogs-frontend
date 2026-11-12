import type { AvisosResponse } from "@/api/contratos/notificaciones"

/** Número de la campanita: hasta 9, después "9+". */
export function textoContador(noLeidas: number): string {
  return noLeidas > 9 ? "9+" : String(noLeidas)
}

/** Copia de la respuesta con esos avisos marcados como leídos (para actualizar la campanita sin esperar). */
export function marcarEnLista(datos: AvisosResponse, ids: number[]): AvisosResponse {
  const marcar = new Set(ids)
  let bajan = 0
  const avisos = datos.avisos.map((a) => {
    if (!a.leida && marcar.has(a.idNotificacion)) {
      bajan++
      return { ...a, leida: true }
    }
    return a
  })
  return { avisos, noLeidas: Math.max(0, datos.noLeidas - bajan) }
}

/** Solo rutas propias del sistema ("/algo"): un enlace raro no debe sacar al usuario a otro sitio. */
export function enlaceInterno(enlace: string | null | undefined): string | null {
  return enlace && enlace.startsWith("/") && !enlace.startsWith("//") ? enlace : null
}

const fechaCorta = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

/**
 * "hace un momento", "hace 5 min", "hace 3 h" o la fecha corta si pasó más de un día.
 * El backend manda la hora de Lima sin zona; el navegador del equipo también está en Lima.
 */
export function cuandoFue(fechaIso: string, ahora = new Date()): string {
  const fecha = new Date(fechaIso)
  if (Number.isNaN(fecha.getTime())) return ""
  const minutos = Math.floor((ahora.getTime() - fecha.getTime()) / 60_000)
  if (minutos < 1) return "hace un momento"
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  return fechaCorta.format(fecha)
}
