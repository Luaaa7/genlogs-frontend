import { axiosClient } from './axiosClient'
import type { Cliente, ClienteDetalle, ClienteRequest, FiltrosCliente } from '../types/cliente.types'
import type { PageResponse } from '@/types/common.types'

const RECURSO = '/clientes'
export const clientesApi = {
  // GET /clientes: sin DTO, devuelve la entidad con `tercero` anidado.
  listar: async (filtros: FiltrosCliente = {}): Promise<Cliente[]> => {
    const { data } = await axiosClient.get<PageResponse<Cliente> | Cliente[]>(RECURSO, { params: filtros })
    return Array.isArray(data) ? data : data.content ?? []
  },
  // GET/POST /clientes: sí pasan por ClienteResponse (DTO plano).
  obtener: (id: number) => axiosClient.get<ClienteDetalle>(`${RECURSO}/${id}`).then((r) => r.data),
  crear: (data: ClienteRequest) => axiosClient.post<ClienteDetalle>(RECURSO, data).then((r) => r.data),
  // Nota: el backend no tiene PUT /clientes/{id} todavía — este método no
  // tiene a quién llamar y ninguna pantalla lo invoca hoy.
  actualizar: (id: number, data: ClienteRequest) => axiosClient.put<ClienteDetalle>(`${RECURSO}/${id}`, data).then((r) => r.data),
}
