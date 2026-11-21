/**
 * Contrato del ingreso del cliente con Google (v3.4, backend luana/v34-ingreso-google).
 *
 * POST /api/portal/google  (público)  body { credential }  → IngresoGoogleResponse
 *   400: token de Google no válido, personal interno, usuario inactivo o bloqueado  { message }
 * GET  /api/portal/cuenta  (CLIENTE)  → CuentaPortalResponse
 * POST /api/portal/empresa (CLIENTE)  body CompletarEmpresaRequest → CompletarEmpresaResponse
 *   400: RUC inválido o no validado en SUNAT   409: la cuenta ya tiene empresa
 */
export const RUTA_API_INGRESO_GOOGLE = "/portal/google"
export const RUTA_API_CUENTA_PORTAL = "/portal/cuenta"
export const RUTA_API_EMPRESA_PORTAL = "/portal/empresa"
export const RUTA_EMPRESA_PORTAL = "/portal/empresa"

export interface IngresoGoogleResponse {
  /** Sin token cuando el acceso está pendiente. */
  token?: string
  nombreUsuario?: string
  nombre?: string
  nombreRol?: string
  /** false: la cuenta todavía no tiene empresa. */
  perfilCompleto: boolean
  /** true: el acceso espera la activación del Jefe Administrativo. */
  pendiente: boolean
  mensaje?: string
}

export interface CuentaPortalResponse {
  nombre: string
  correo: string
  perfilCompleto: boolean
  empresa?: string | null
}

export interface CompletarEmpresaRequest {
  ruc: string
  razonSocial: string
  nombreContacto: string
  telefono?: string
}

export interface CompletarEmpresaResponse {
  pendiente: boolean
  mensaje: string
}

/** RUC de empresa (20) o de persona con negocio (10), igual que el backend. */
export function rucValido(ruc: string): boolean {
  return /^(10|20)\d{9}$/.test(ruc)
}
