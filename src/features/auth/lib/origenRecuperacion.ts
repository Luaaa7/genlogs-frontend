/**
 * Desde dónde empezó la recuperación de contraseña. La recuperación es una sola para todos
 * (personal y clientes); lo único que cambia es a qué pantalla de ingreso se vuelve.
 * El correo abre /reset-password sin saber de dónde venía la persona, por eso el origen
 * se recuerda en este navegador mientras dura el proceso.
 */
export type OrigenRecuperacion = "portal" | null

export const CLAVE_ORIGEN = "genlogs-origen-recuperacion"

export function leerOrigen(): OrigenRecuperacion {
  try {
    return localStorage.getItem(CLAVE_ORIGEN) === "portal" ? "portal" : null
  } catch {
    return null
  }
}

/** «portal» se recuerda; cualquier otro valor borra lo recordado. */
export function guardarOrigen(origen: string | null) {
  try {
    if (origen === "portal") localStorage.setItem(CLAVE_ORIGEN, "portal")
    else localStorage.removeItem(CLAVE_ORIGEN)
  } catch {
    /* sin almacenamiento: se vuelve al login del personal */
  }
}

export const limpiarOrigen = () => guardarOrigen(null)

export const rutaIngreso = (origen: OrigenRecuperacion) => (origen === "portal" ? "/portal/ingreso" : "/login")
