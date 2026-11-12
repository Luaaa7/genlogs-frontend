/**
 * Acciones de aprobación interna de una cotización (BE, aún no fusionada).
 * Enviar al cliente sigue en POST /cotizaciones/{id}/enviar y solo funciona
 * desde APROBADA_INTERNA. El backend responde 400 si el estado no es el que
 * pide la acción.
 *
 *   POST /cotizaciones/{id}/solicitar-aprobacion   sin cuerpo. BORRADOR -> PENDIENTE_APROBACION
 *   POST /cotizaciones/{id}/aprobar                sin cuerpo. PENDIENTE_APROBACION -> APROBADA_INTERNA
 *   POST /cotizaciones/{id}/devolver               DevolverCotizacionRequest. PENDIENTE_APROBACION -> BORRADOR
 */
export const rutaCotizacionSolicitarAprobacion = (id: number) => `/cotizaciones/${id}/solicitar-aprobacion`
export const rutaCotizacionAprobar = (id: number) => `/cotizaciones/${id}/aprobar`
export const rutaCotizacionDevolver = (id: number) => `/cotizaciones/${id}/devolver`

/** Motivo obligatorio. Lo valida la pantalla (mínimo 5) y el backend. */
export interface DevolverCotizacionRequest {
  motivo: string
}
