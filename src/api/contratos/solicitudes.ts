import type { CanalSolicitud, EstadoSolicitud } from './enumeraciones'

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