import { axiosClient } from './axiosClient'
import type { PageResponse } from '@/types/common.types'
import type {
  EstadoReclamo,
  Reclamo,
  ReclamoFiltros,
  ReclamoInput,
  ResponsableReclamo,
  SeguimientoReclamo,
} from '@/types/reclamo.types'

export const reclamosApi = {
  listar: (filtros: ReclamoFiltros = {}) =>
    axiosClient.get<PageResponse<Reclamo>>('/reclamos', { params: filtros }).then((r) => r.data),
  obtener: (id: number) => axiosClient.get<Reclamo>(`/reclamos/${id}`).then((r) => r.data),
  responsables: () => axiosClient.get<ResponsableReclamo[]>('/reclamos/responsables').then((r) => r.data),
  crear: (data: ReclamoInput) => axiosClient.post<Reclamo>('/reclamos', data).then((r) => r.data),
  actualizar: (id: number, data: ReclamoInput) => axiosClient.put<Reclamo>(`/reclamos/${id}`, data).then((r) => r.data),
  cambiarEstado: (id: number, estado: EstadoReclamo, comentario?: string) =>
    axiosClient.patch<Reclamo>(`/reclamos/${id}/estado`, { estado, comentario }).then((r) => r.data),
  comentar: (id: number, comentario: string) =>
    axiosClient.post<SeguimientoReclamo>(`/reclamos/${id}/seguimientos`, { comentario }).then((r) => r.data),
  eliminar: (id: number) => axiosClient.delete<void>(`/reclamos/${id}`).then(() => undefined),
}
