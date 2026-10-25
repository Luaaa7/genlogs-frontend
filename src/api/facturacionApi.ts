import { axiosClient } from './axiosClient'
import type { PageResponse } from '@/types/common.types'
import type { EstadoFacturacion, Factura, FacturaInput, FacturacionFiltros, RegistrarPagoInput } from '@/types/facturacion.types'

export const facturacionApi = {
  listar: async (filtros: FacturacionFiltros = {}): Promise<PageResponse<Factura>> => {
    const { data } = await axiosClient.get<PageResponse<Factura>>('/facturacion', { params: filtros })
    return data
  },
  obtener: (id: number) => axiosClient.get<Factura>(`/facturacion/${id}`).then((r) => r.data),
  crear: (data: FacturaInput) => axiosClient.post<Factura>('/facturacion', data).then((r) => r.data),
  /** PATCH /facturacion/{id}/pago — suma el monto; el backend pasa a PARCIAL o PAGADA. */
  registrarPago: (id: number, pago: RegistrarPagoInput) =>
    axiosClient.patch<Factura>(`/facturacion/${id}/pago`, pago).then((r) => r.data),
  /** PATCH /facturacion/{id}/estado — por ejemplo para anular. */
  cambiarEstado: (id: number, codigoEstado: EstadoFacturacion) =>
    axiosClient.patch<Factura>(`/facturacion/${id}/estado`, { codigoEstado }).then((r) => r.data),
  anular: (id: number) =>
    axiosClient.patch<Factura>(`/facturacion/${id}/estado`, { codigoEstado: 'ANULADA' }).then((r) => r.data),
  descargarPdf: (id: number) => axiosClient.get<Blob>(`/facturacion/${id}/pdf`, { responseType: 'blob' }).then((r) => r.data),
}