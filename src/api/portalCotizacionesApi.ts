import { axiosClient } from "./axiosClient"

/**
 * Contrato de BE-C (Alelhy, feat/be-c-cotizacion-oc-despacho), solo con sesión de cliente:
 * GET  /portal/cotizaciones            → CotizacionPortal[] (sin líneas)
 * GET  /portal/cotizaciones/:id        → CotizacionPortal (con líneas)
 * POST /portal/cotizaciones/:id/aprobar  { motivo? } → CotizacionPortal
 * POST /portal/cotizaciones/:id/rechazar { motivo? } → CotizacionPortal
 * Nunca trae margen, costo ni proveedor (RNF-34). Si ya no se puede decidir responde 400 con message.
 */
export interface LineaCotizacionPortal {
  descripcion: string
  cantidad: number
  unidad?: string
  precioUnitario: number
  importe: number
}

export interface CotizacionPortal {
  id: number
  codigo: string
  fechaCotizacion?: string
  fechaValidez?: string | null
  /** Nombre del estado para mostrar ("Enviada", "Aprobada"…). */
  estado: string
  /** Opcional: código del estado (ENVIADA, APROBADA…), si el backend lo agrega. */
  codigoEstado?: string
  /** Opcional: el backend dice si todavía se puede aprobar o rechazar. */
  puedeDecidir?: boolean
  total: number
  moneda?: string
  /** N.º de la OC de la minera, si la cotización ya tiene una. */
  numeroOcCliente?: string
  lineas?: LineaCotizacionPortal[]
}

const base = "/portal/cotizaciones"

export const portalCotizacionesApi = {
  listar: () => axiosClient.get<CotizacionPortal[]>(base).then(({ data }) => data),
  detalle: (id: number) => axiosClient.get<CotizacionPortal>(`${base}/${id}`).then(({ data }) => data),
  aprobar: (id: number, motivo?: string) =>
    axiosClient.post<CotizacionPortal>(`${base}/${id}/aprobar`, { motivo: motivo ?? null }).then(({ data }) => data),
  rechazar: (id: number, motivo?: string) =>
    axiosClient.post<CotizacionPortal>(`${base}/${id}/rechazar`, { motivo: motivo ?? null }).then(({ data }) => data),
}
