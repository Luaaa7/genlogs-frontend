// src/api/solicitudWebApi.ts
import { axiosClient } from "./axiosClient"
import type {
  SolicitudWeb,
  CreateSolicitudWebRequest,
  SolicitudWebResponse,
  EstadoSolicitud,
} from "@/types/solicitudWeb.types"

/**
 * Crea una solicitud web pública (sin autenticación).
 * Nota: axiosClient adjunta el token si existe; si el endpoint es público
 * el backend simplemente lo ignora.
 */
export async function crearSolicitudWeb(
  data: CreateSolicitudWebRequest
): Promise<SolicitudWebResponse> {
  const response = await axiosClient.post<SolicitudWebResponse>("/solicitudes-web", data)
  return response.data
}

/** Obtiene solicitudes web paginadas (acceso protegido). */
export async function listarSolicitudesWeb(
  page = 0,
  size = 10
): Promise<{
  content: SolicitudWeb[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}> {
  const params = new URLSearchParams()
  params.append("page", String(page))
  params.append("size", String(size))
  params.append("sortBy", "fechaCreacion")
  params.append("sortDir", "DESC")

  const response = await axiosClient.get("/solicitudes-web", { params })
  return response.data
}

/** Obtiene una solicitud web específica por ID (acceso protegido). */
export async function obtenerSolicitudWeb(id: number): Promise<SolicitudWeb> {
  const response = await axiosClient.get<SolicitudWeb>(`/solicitudes-web/${id}`)
  return response.data
}

/** Actualiza el estado de una solicitud web (acceso protegido). */
export async function actualizarEstadoSolicitud(
  id: number,
  nuevoEstado: EstadoSolicitud,
  observaciones?: string
): Promise<SolicitudWeb> {
  const response = await axiosClient.put<SolicitudWeb>(`/solicitudes-web/${id}/estado`, {
    estadoSolicitud: nuevoEstado,
    observacionesInternas: observaciones,
  })
  return response.data
}

/** Asocia una cotización a una solicitud web. */
export async function asociarCotizacion(
  solicitudId: number,
  cotizacionId: number
): Promise<SolicitudWeb> {
  const response = await axiosClient.put<SolicitudWeb>(
    `/solicitudes-web/${solicitudId}/cotizacion`,
    { cotizacionId }
  )
  return response.data
}

/** Busca solicitudes web por filtros (acceso protegido). */
export async function buscarSolicitudesWeb(filtros: {
  estado?: EstadoSolicitud
  email?: string
  empresaNombre?: string
  page?: number
  size?: number
}): Promise<{
  content: SolicitudWeb[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}> {
  const params = new URLSearchParams()

  if (filtros.estado) params.append("estado", filtros.estado)
  if (filtros.email) params.append("email", filtros.email)
  if (filtros.empresaNombre) params.append("empresaNombre", filtros.empresaNombre)

  params.append("page", String(filtros.page ?? 0))
  params.append("size", String(filtros.size ?? 10))
  params.append("sortBy", "fechaCreacion")
  params.append("sortDir", "DESC")

  const response = await axiosClient.get("/solicitudes-web/buscar", { params })
  return response.data
}

/** Envía un email de confirmación para una solicitud web. */
export async function enviarConfirmacion(
  solicitudId: number,
  email: string
): Promise<{ success: boolean; mensaje: string }> {
  const response = await axiosClient.post(`/solicitudes-web/${solicitudId}/enviar-confirmacion`, {
    email,
  })
  return response.data
}

// Backward-compatible object export so existing call-sites using
// `solicitudWebApi.crearSolicitudWeb(...)` continue to work.
export const solicitudWebApi = {
  crearSolicitudWeb,
  listarSolicitudesWeb,
  obtenerSolicitudWeb,
  actualizarEstadoSolicitud,
  asociarCotizacion,
  buscarSolicitudesWeb,
  enviarConfirmacion,
}
