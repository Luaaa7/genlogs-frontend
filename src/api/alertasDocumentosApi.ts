import { axiosClient } from './axiosClient'
import { RUTA_NOTIFICACIONES, rutaMarcarLeida, type AvisosResponse, type NotificacionResponse } from './contratos'

/** Tipo de aviso que crea la tarea diaria de PASE y SCTR por vencer (BE-D). */
export const TIPO_DOCUMENTO_POR_VENCER = 'DOCUMENTO_POR_VENCER'

/** Avisos de PASE y SCTR por vencer del usuario, tomados de la campanita (GET /notificaciones). */
export async function listarAlertasDocumentos(): Promise<NotificacionResponse[]> {
  const { data } = await axiosClient.get<AvisosResponse>(RUTA_NOTIFICACIONES)
  return (data?.avisos ?? []).filter((aviso) => aviso.tipo === TIPO_DOCUMENTO_POR_VENCER)
}

export async function marcarAlertaLeida(idNotificacion: number): Promise<void> {
  await axiosClient.patch(rutaMarcarLeida(idNotificacion))
}
