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