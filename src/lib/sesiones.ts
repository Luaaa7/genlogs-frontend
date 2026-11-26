/**
 * Sesiones de GENLOGS (FE-A). El personal interno y el cliente del portal tienen
 * cada uno su propia sesión, con claves distintas, para que nunca se mezclen:
 *  - Interna: localStorage "access_token"/"refresh_token" + sessionStorage "genlogs-auth" (Zustand).
 *  - Cliente: localStorage "cliente_access_token" + sessionStorage "genlogs-cliente-auth".
 * El almacenamiento del navegador puede fallar (modo privado, bloqueado): todo va en try/catch.
 */

/** Marca que el 401 deja en la URL del login para avisar que la sesión venció (?motivo=sesion-expirada). */
export const PARAMETRO_MOTIVO = "motivo"
export const MOTIVO_SESION_EXPIRADA = "sesion-expirada"
export const MENSAJE_SESION_VENCIDA = "Tu sesión venció. Inicia sesión nuevamente para continuar."

/** ¿La URL trae la marca de sesión vencida? */
export function sesionVencidaEn(search: string): boolean {
  return new URLSearchParams(search).get(PARAMETRO_MOTIVO) === MOTIVO_SESION_EXPIRADA
}

const CLAVE_TOKEN_CLIENTE = "cliente_access_token"
const CLAVE_SESION_CLIENTE = "genlogs-cliente-auth"

export interface SesionCliente {
  nombre: string
  rol: "CLIENTE"
  /**
   * false: la cuenta entró con Google y todavía no dio los datos de su empresa;
   * el portal se los pide antes de la primera cotización (v3.4). Sin el dato, true.
   */
  perfilCompleto: boolean
}

export function cerrarSesionInterna() {
  try {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    sessionStorage.removeItem("genlogs-auth")
  } catch {
    /* sin almacenamiento: no hay sesión que cerrar */
  }
}

export function cerrarSesionCliente() {
  try {
    localStorage.removeItem(CLAVE_TOKEN_CLIENTE)
    sessionStorage.removeItem(CLAVE_SESION_CLIENTE)
  } catch {
    /* sin almacenamiento: no hay sesión que cerrar */
  }
}

/** ¿Hay una sesión del personal interno abierta en este navegador? */
export function haySesionInterna(): boolean {
  try {
    return Boolean(localStorage.getItem("access_token") || sessionStorage.getItem("genlogs-auth"))
  } catch {
    return false
  }
}

/**
 * Abre la sesión del cliente. Cierra antes la interna: en un mismo navegador
 * no conviven las dos (el portal rechaza entrar si hay una sesión interna).
 */
export function iniciarSesionCliente(token: string, nombre: string, perfilCompleto = true): boolean {
  cerrarSesionInterna()
  try {
    localStorage.setItem(CLAVE_TOKEN_CLIENTE, token)
    const sesion: SesionCliente = { nombre, rol: "CLIENTE", perfilCompleto }
    sessionStorage.setItem(CLAVE_SESION_CLIENTE, JSON.stringify(sesion))
    return true
  } catch {
    return false
  }
}

/** Sesión del cliente, o null si no hay (o si es de otro rol). */
export function leerSesionCliente(): SesionCliente | null {
  try {
    const token = localStorage.getItem(CLAVE_TOKEN_CLIENTE)
    const crudo = sessionStorage.getItem(CLAVE_SESION_CLIENTE)
    if (!token || !crudo) return null
    const datos = JSON.parse(crudo) as { nombre?: unknown; rol?: unknown; perfilCompleto?: unknown }
    const rol = typeof datos.rol === "string" ? datos.rol.toUpperCase() : "CLIENTE"
    if (rol !== "CLIENTE") return null
    return {
      nombre: typeof datos.nombre === "string" ? datos.nombre : "",
      rol: "CLIENTE",
      perfilCompleto: datos.perfilCompleto !== false,
    }
  } catch {
    return null
  }
}

/** La cuenta ya dio los datos de su empresa: el portal deja de pedirlos. */
export function marcarPerfilCompleto(nombre?: string) {
  const actual = leerSesionCliente()
  if (!actual) return
  try {
    const sesion: SesionCliente = { nombre: nombre?.trim() || actual.nombre, rol: "CLIENTE", perfilCompleto: true }
    sessionStorage.setItem(CLAVE_SESION_CLIENTE, JSON.stringify(sesion))
  } catch {
    /* sin almacenamiento: se volverá a pedir al recargar */
  }
}

/** El portal solo se abre con sesión de cliente y sin sesión interna al mismo tiempo. */
export function puedeEntrarAlPortal(): boolean {
  return leerSesionCliente() !== null && !haySesionInterna()
}
