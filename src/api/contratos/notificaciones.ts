/**
 * Contrato de la campanita de avisos internos (Paso 0, D-21 y D-25). Backend ya
 * implementado en el Paso 0; la pantalla es de FE-A (feat/fe-a-campanita).
 *
 *   GET   /api/notificaciones             -> 200 AvisosResponse (ultimos 50, mas recientes primero)
 *   PATCH /api/notificaciones/{id}/leida  -> 204; 404 si no existe o no es tuyo
 *   401 sin sesion - 403 rol CLIENTE. Los avisos no se borran.
 */
export const RUTA_NOTIFICACIONES = '/notificaciones'
export const rutaMarcarLeida = (idNotificacion: number) => `/notificaciones/${idNotificacion}/leida`

export interface NotificacionResponse {
  idNotificacion: number
  /** Uno de TIPOS_AVISO (enumeraciones.ts); puede llegar uno nuevo, tratalo como GENERAL. */
  tipo: string
  titulo: string
  mensaje: string | null
  /** Ruta del frontend a la que lleva el aviso, p. ej. /cotizaciones/15. */
  enlace: string | null
  leida: boolean
  /** ISO 8601 sin zona (hora de Lima). */
  fechaCreacion: string
}

export interface AvisosResponse {
  noLeidas: number
  avisos: NotificacionResponse[]
}