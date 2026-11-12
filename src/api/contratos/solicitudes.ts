import type { PageResponse } from '@/types/common.types'
import type { CanalSolicitud, EstadoSolicitud, TipoPlazo } from './enumeraciones'

/**
 * Contrato del endpoint unico de solicitudes (Paso 0). Lo implementa BE-B
 * (feat/be-b-endpoint-solicitudes); portal (FE-B), landing y vitrina (FE-D) lo usan.
 * Espejo del backend: SolicitudRequest y SolicitudCreadaResponse.
 *
 *   POST /api/solicitudes   (axiosClient ya antepone /api: usa RUTA_SOLICITUDES)
 *   201 -> SolicitudCreadaResponse
 *   400 -> validacion - 401 -> sin sesion (la landing manda al registro con ?volver=, D-30)
 *   403 -> rol sin permiso - 429 -> demasiadas solicitudes seguidas
 *   501 -> mientras BE-B no lo implemente
 */
export const RUTA_SOLICITUDES = '/solicitudes'

export interface SolicitudItemRequest {
  /** Marca del catalogo (opcional). */
  idMarca?: number
  /** Marca escrita a mano si no esta en el catalogo (max. 100). */
  marcaTexto?: string
  /** N. de parte del fabricante: el dato principal (D-01). Max. 60. */
  numeroParte?: string
  /** Opcional, de 8 a 14 digitos. */
  gtin?: string
  /** Obligatoria, max. 255. */
  descripcion: string
  /** Mayor a 0, hasta 2 decimales. */
  cantidad: number
  unidad?: string
  /** Foto o plano ya subido (URL de Cloudinary). */
  urlFoto?: string
  /** Producto de la vitrina, si viene de "Cotizar". */
  idProducto?: number
}

export interface SolicitudRequest {
  canal: CanalSolicitud
  /** Obligatorio, max. 150. */
  asunto: string
  /** Max. 4000. */
  descripcion?: string
  /** De 1 a 50 repuestos. */
  items: SolicitudItemRequest[]
}

/** Sin fechas ni plazos: el cliente solo ve estados (D-14). */
export interface SolicitudCreadaResponse {
  idSolicitud: number
  codigoSolicitud: string
  estado: EstadoSolicitud
}

/**
 * Gestion interna (BE-B, aun no fusionada). Cada PATCH responde SolicitudInternaResponse.
 * 409 si la solicitud ya esta COTIZADA, RECHAZADA o CANCELADA, o no esta en el estado
 * que la accion exige.
 *
 *   PATCH /solicitudes/{id}/iniciar        sin cuerpo. PENDIENTE -> EN_REVISION
 *   PATCH /solicitudes/{id}/pausar         PausarSolicitudRequest -> EN_ESPERA_TERCERO
 *   PATCH /solicitudes/{id}/reanudar       sin cuerpo. vuelve a EN_REVISION
 *   PATCH /solicitudes/{id}/reclasificar   ReclasificarSolicitudRequest. La 2.a solo la hace el Jefe
 *   PATCH /solicitudes/{id}/reasignar      ReasignarSolicitudRequest. Solo el Jefe
 *   GET   /solicitudes/{id}/historial      EventoSolicitud[]
 */
export const rutaSolicitudIniciar = (id: number) => `${RUTA_SOLICITUDES}/${id}/iniciar`
export const rutaSolicitudPausar = (id: number) => `${RUTA_SOLICITUDES}/${id}/pausar`
export const rutaSolicitudReanudar = (id: number) => `${RUTA_SOLICITUDES}/${id}/reanudar`
export const rutaSolicitudReclasificar = (id: number) => `${RUTA_SOLICITUDES}/${id}/reclasificar`
export const rutaSolicitudReasignar = (id: number) => `${RUTA_SOLICITUDES}/${id}/reasignar`
export const rutaSolicitudHistorial = (id: number) => `${RUTA_SOLICITUDES}/${id}/historial`

/** motivo obligatorio, max. 40. fechaEstimada: fecha ISO sin hora; no puede ser pasada. */
export interface PausarSolicitudRequest {
  motivo: string
  fechaEstimada?: string
}

/** La segunda reclasificacion solo la hace el Jefe. */
export interface ReclasificarSolicitudRequest {
  tipoPlazo: TipoPlazo
}

/** Solo el Jefe. */
export interface ReasignarSolicitudRequest {
  idUsuario: number
}

/** tipo llega como texto. fecha: ISO sin zona horaria. */
export interface EventoSolicitud {
  tipo: string
  detalle: string | null
  usuario: string | null
  fecha: string
}

export interface UsuarioResumen {
  idUsuario: number
  nombreUsuario: string
  nombres: string
}

/**
 * Respuesta de cada PATCH. estado y tipoPlazo viajan como string, con los textos
 * de EstadoSolicitud y TipoPlazo (enumeraciones.ts, iguales al enum del backend).
 * Pausada no es un campo: la solicitud esta pausada cuando pausadaDesde != null.
 */
export interface SolicitudInternaResponse {
  idSolicitud: number
  codigoSolicitud: string
  asunto: string
  cliente: string
  estado: EstadoSolicitud
  tipoPlazo: TipoPlazo
  /** ISO sin zona horaria. */
  fechaRecepcion: string
  fechaLimiteInterna: string | null
  pausadaDesde: string | null
  motivoPausa: string | null
  /** Fecha ISO sin hora. */
  fechaEstimadaTercero: string | null
  reclasificaciones: number
  asignado: UsuarioResumen | null
}

/**
 * Pendiente de confirmar con BE-B.
 * GET /solicitudes (RUTA_SOLICITUDES) con filtros, orden por vencimiento y paginacion.
 * El servicio aun no tiene metodo de lista ni semaforo. No calcular el color en el cliente.
 */
export interface FiltrosSolicitudes {
  page: number
  size: number
  q?: string
  estado?: EstadoSolicitud
  tipoPlazo?: TipoPlazo
  idAsistente?: number
}

/** Fila de la lista propuesta. El semaforo, si viene, lo calcula el backend. */
export interface SolicitudInternaFila extends SolicitudInternaResponse {
  semaforo?: 'VERDE' | 'AMARILLO' | 'ROJO' | null
}

export type ListaSolicitudesResponse = PageResponse<SolicitudInternaFila>