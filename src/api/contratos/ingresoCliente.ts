import { PARAMETRO_VOLVER, esRutaInterna } from './registro'

/**
 * Contrato del ingreso del cliente al portal (FE-A / BE-A). Va separado del
 * login interno (/api/auth/login): el cliente entra con su correo y recibe un
 * token de rol CLIENTE. Lo implementa BE-A en feat/be-a-portal-registro.
 *
 * POST /api/portal/login  (público, sin token)
 *   body: IngresoClienteRequest
 *   200:  IngresoClienteResponse
 *   401:  correo o contraseña incorrectos   { message }
 *   403:  el usuario no es CLIENTE          { message }
 *   423:  usuario bloqueado o inactivo      { message }
 */
export const RUTA_API_INGRESO_CLIENTE = '/portal/login'
export const RUTA_INGRESO_CLIENTE = '/portal/ingreso'

export interface IngresoClienteRequest {
  correo: string
  password: string
}

export interface IngresoClienteResponse {
  token: string
  nombreUsuario?: string
  /** Nombre a mostrar (contacto o razón social). */
  nombre?: string
  /** Siempre "CLIENTE"; el frontend rechaza cualquier otro. */
  nombreRol: string
}

/** /portal/ingreso?volver=%2Fportal%2Fsolicitud */
export function rutaIngresoCliente(volver?: string): string {
  if (!esRutaInterna(volver)) return RUTA_INGRESO_CLIENTE
  return `${RUTA_INGRESO_CLIENTE}?${PARAMETRO_VOLVER}=${encodeURIComponent(volver)}`
}
