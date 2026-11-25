import { axiosClient } from "./axiosClient"

/**
 * Pago en línea del comprobante (BPMN 4.1), solo con sesión de cliente:
 * GET  /portal/comprobantes                 → ComprobantePortal[] (solo los de su empresa)
 * POST /portal/comprobantes/:id/pagar       → { urlPago } (checkout de Mercado Pago por el saldo)
 * POST /portal/comprobantes/pago/confirmar  { idPago } → ResultadoPago
 * Nunca trae datos internos. Si no se puede pagar responde 400 con message.
 */
export interface ComprobantePortal {
  id: number
  /** Serie-número, p. ej. F001-00000012. */
  comprobante: string
  tipo?: string | null
  fechaEmision?: string | null
  fechaVencimiento?: string | null
  total: number
  montoPagado: number
  saldoPendiente: number
  /** PEN o USD. */
  moneda: string
  estado?: string | null
  codigoEstado?: string | null
  numeroOcCliente?: string | null
  puedePagarEnLinea: boolean
  /** Por qué no se puede pagar en línea; null si sí se puede. */
  motivoSinPago?: string | null
}

export type EstadoResultadoPago = "REGISTRADO" | "YA_REGISTRADO" | "PENDIENTE" | "RECHAZADO" | "REVISION" | "IGNORADO"

export interface ResultadoPago {
  estado: EstadoResultadoPago
  mensaje: string
  idComprobante?: number | null
  comprobante?: string | null
  monto?: number | null
  saldoPendiente?: number | null
}

const base = "/portal/comprobantes"

export const portalComprobantesApi = {
  listar: () => axiosClient.get<ComprobantePortal[]>(base).then(({ data }) => data),
  pagar: (id: number) => axiosClient.post<{ urlPago: string }>(`${base}/${id}/pagar`).then(({ data }) => data),
  confirmar: (idPago: string) =>
    axiosClient.post<ResultadoPago>(`${base}/pago/confirmar`, { idPago }).then(({ data }) => data),
}