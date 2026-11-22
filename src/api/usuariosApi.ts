import { axiosClient } from "./axiosClient";
import type { UsuarioRequest, UsuarioResponse, UsuarioUpdateRequest } from "@/types/usuario"

export async function listarUsuarios(): Promise<UsuarioResponse[]> {
  const response = await axiosClient.get<UsuarioResponse[]>("/usuarios")
  return response.data
}

export async function crearUsuario(data: UsuarioRequest): Promise<UsuarioResponse> {
  const response = await axiosClient.post<UsuarioResponse>("/usuarios", data)
  return response.data
}

export async function actualizarUsuario(idUsuario: number, data: UsuarioUpdateRequest): Promise<UsuarioResponse> {
  const response = await axiosClient.put<UsuarioResponse>(`/usuarios/${idUsuario}`, data)
  return response.data
}

export async function eliminarUsuario(idUsuario: number): Promise<void> {
  await axiosClient.delete(`/usuarios/${idUsuario}`)
}

export async function cambiarBloqueoUsuario(
  idUsuario: number,
  bloqueado: boolean
): Promise<UsuarioResponse> {
  const response = await axiosClient.patch<UsuarioResponse>(
    `/usuarios/${idUsuario}/bloqueo?bloqueado=${bloqueado}`
  )
  return response.data
}

/** Acceso del portal que espera la revisión del Jefe Administrativo (BPMN 8.4). */
export interface AccesoPendiente {
  idUsuario: number
  nombres: string
  correo: string
  empresa: string | null
  ruc: string | null
  fechaSolicitud: string | null
  /** REGISTRO: se registró con el RUC de una empresa cliente. GOOGLE: entró con Google y dio ese RUC. */
  origen: "REGISTRO" | "GOOGLE"
}

export async function listarAccesosPendientes(): Promise<AccesoPendiente[]> {
  const response = await axiosClient.get<AccesoPendiente[]>("/usuarios/pendientes-portal")
  return response.data
}

export async function activarAccesoPendiente(idUsuario: number): Promise<void> {
  await axiosClient.patch(`/usuarios/${idUsuario}/activar`)
}

export async function rechazarAccesoPendiente(idUsuario: number): Promise<void> {
  await axiosClient.patch(`/usuarios/${idUsuario}/rechazar`)
}
