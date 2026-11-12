import { axiosClient } from '@/api/axiosClient'
import { RUTA_NOTIFICACIONES, type AvisosResponse, type NotificacionResponse, type TipoAviso } from '@/api/contratos'

/**
 * El aviso de alto valor no vive en la cotización: al aprobar, el backend se lo
 * manda solo al Gerente y se lee con el resto de la campanita.
 */
let usarMock = false
usarMock = true // borra esta línea para GET /notificaciones real

const TIPO_ALTO_VALOR = 'ALTO_VALOR' satisfies TipoAviso

const avisoSimulado: NotificacionResponse = {
  idNotificacion: 1,
  tipo: TIPO_ALTO_VALOR,
  titulo: 'Cotización de alto valor',
  mensaje: 'Esta cotización quedó aprobada y el Gerente debe verla.',
  enlace: '/cotizaciones/1',
  leida: false,
  fechaCreacion: '2026-11-11T10:00:00',
}

export async function listarAvisos(): Promise<AvisosResponse> {
  if (usarMock) return { noLeidas: 1, avisos: [avisoSimulado] }
  const { data } = await axiosClient.get<AvisosResponse>(RUTA_NOTIFICACIONES)
  return data
}
