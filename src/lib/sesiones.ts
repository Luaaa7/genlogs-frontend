/**
 * Sesiones de GENLOGS (FE-A). El personal interno y el cliente del portal tienen
 * cada uno su propia sesión, con claves distintas, para que nunca se mezclen:
 *  - Interna: localStorage "access_token"/"refresh_token" + sessionStorage "genlogs-auth" (Zustand).
 *  - Cliente: localStorage "cliente_access_token" + sessionStorage "genlogs-cliente-auth".
 * El almacenamiento del navegador puede fallar (modo privado, bloqueado): todo va en try/catch.
 */

const CLAVE_TOKEN_CLIENTE = "cliente_access_token"
const CLAVE_SESION_CLIENTE = "genlogs-cliente-auth"

export interface SesionCliente {
  nombre: string
  rol: "CLIENTE"
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
export function iniciarSesionCliente(token: string, nombre: string): boolean {
  cerrarSesionInterna()
  try {
    localStorage.setItem(CLAVE_TOKEN_CLIENTE, token)
    const sesion: SesionCliente = { nombre, rol: "CLIENTE" }
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
    const datos = JSON.parse(crudo) as { nombre?: unknown; rol?: unknown }
    const rol = typeof datos.rol === "string" ? datos.rol.toUpperCase() : "CLIENTE"
    if (rol !== "CLIENTE") return null
    return { nombre: typeof datos.nombre === "string" ? datos.nombre : "", rol: "CLIENTE" }
  } catch {
    return null
  }
}

/** El portal solo se abre con sesión de cliente y sin sesión interna al mismo tiempo. */
export function puedeEntrarAlPortal(): boolean {
  return leerSesionCliente() !== null && !haySesionInterna()
}
