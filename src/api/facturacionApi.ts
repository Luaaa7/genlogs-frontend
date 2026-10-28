import { axiosClient } from './axiosClient'
import type { PageResponse } from '@/types/common.types'
import type { EmitirFacturaInput, EnviarComprobanteInput, EstadoFacturacion, Factura, FacturaInput, FacturacionFiltros, RegistrarPagoInput, SunatConfig, TipoComprobanteCatalogo } from '@/types/facturacion.types'

export const facturacionApi = {
  listar: async (filtros: FacturacionFiltros = {}): Promise<PageResponse<Factura>> => {
    const { data } = await axiosClient.get<PageResponse<Factura>>('/facturacion', { params: filtros })
    return data
  },
  obtener: (id: number) => axiosClient.get<Factura>(`/facturacion/${id}`).then((r) => r.data),
  crear: (data: FacturaInput) => axiosClient.post<Factura>('/facturacion', data).then((r) => r.data),
  /** POST /facturacion/emitir — el sistema pone serie y número y lo manda al emisor (simulado o real). */
  emitir: (data: EmitirFacturaInput) => axiosClient.post<Factura>('/facturacion/emitir', data).then((r) => r.data),
  /** GET /facturacion/sunat — modo de emisión (SIMULADO / PROVEEDOR) y series. */
  sunatConfig: () => axiosClient.get<SunatConfig>('/facturacion/sunat').then((r) => r.data),
  /** POST /facturacion/{id}/enviar — correo al cliente con el PDF adjunto. Responde 200 aunque falle: mirar success. */
  enviar: (id: number, data: EnviarComprobanteInput) =>
    axiosClient.post<{ success: boolean; mensaje: string }>(`/facturacion/${id}/enviar`, data).then((r) => r.data),
  tiposComprobante: () => axiosClient.get<TipoComprobanteCatalogo[]>('/tipos-comprobante').then((r) => r.data),
  /** POST /facturacion/{id}/archivo — sube el documento emitido por SUNAT (reemplaza el anterior). */
  subirArchivo: (id: number, archivo: File) => {
    const form = new FormData()
    form.append('archivo', archivo)
    return axiosClient.post<Factura>(`/facturacion/${id}/archivo`, form).then((r) => r.data)
  },
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