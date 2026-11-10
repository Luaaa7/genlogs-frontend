import axios from "axios"

/**
 * Mensajes de error claros para todo el sistema.
 *
 * Prioridad:
 *  1. El mensaje que manda el backend ("message"): ya viene en español y dice
 *     qué pasó ("Ya existe un registro con número de documento …").
 *  2. Un mensaje según el tipo de fallo (sin conexión, servidor iniciando,
 *     sesión vencida, sin permiso…).
 *  3. El texto por defecto que da cada pantalla.
 */
export function mensajeError(error: unknown, porDefecto = "Ocurrió un error inesperado. Intenta de nuevo."): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error && error.message && !/^Request failed/i.test(error.message) ? error.message : porDefecto
  }

  const status = error.response?.status
  const data = error.response?.data as { message?: unknown; error?: unknown } | string | undefined
  const delServidor =
    typeof data === "object" && data !== null
      ? (typeof data.message === "string" && data.message) || (typeof data.error === "string" && data.error) || ""
      : ""

  // Render devuelve 502/503/504 (a veces HTML) mientras el servicio despierta: el texto del
  // backend no aplica ahí.
  if (status === 502 || status === 504 || (status === 503 && !delServidor)) {
    return "El servidor se está iniciando. Espera unos segundos y vuelve a intentar."
  }
  if (delServidor && status !== 500) return delServidor

  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return "El servidor tardó demasiado en responder. Si es la primera acción del día puede estar iniciando; intenta de nuevo en unos segundos."
  }
  if (!error.response) {
    return typeof navigator !== "undefined" && navigator.onLine === false
      ? "No tienes conexión a internet. Revisa tu red e intenta de nuevo."
      : "No se pudo conectar con el servidor. Revisa tu conexión o intenta de nuevo en unos segundos."
  }

  switch (status) {
    case 400:
      return porDefecto
    case 401:
      return "Tu sesión expiró. Vuelve a iniciar sesión."
    case 403:
      return "No tienes permisos para realizar esta acción."
    case 404:
      return "No se encontró lo que buscas. Puede que haya sido eliminado."
    case 409:
      return "La operación entra en conflicto con datos existentes."
    case 413:
      return "El archivo es demasiado grande."
    case 415:
      return "El tipo de archivo no está permitido."
    case 429:
      return "Demasiadas solicitudes seguidas. Espera un momento e intenta de nuevo."
    default:
      if (status && status >= 500) {
        return delServidor || "Ocurrió un error en el servidor. Intenta de nuevo; si continúa, avisa al administrador."
      }
      return porDefecto
  }
}

/** Mensaje de la pantalla + la causa concreta, sin repetir: "No se pudo guardar. Tu sesión expiró…". */
export function mensajeConCausa(error: unknown, contexto: string): string {
  const causa = mensajeError(error, "")
  if (!causa || causa === contexto) return contexto
  const base = /[.!?]$/.test(contexto.trim()) ? contexto.trim() : `${contexto.trim()}.`
  return `${base} ${causa}`
}
