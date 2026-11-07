import { describe, expect, it } from "vitest"
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios"
import { mensajeConCausa, mensajeError } from "./errores"

function errorHttp(status: number, data?: unknown, code?: string): AxiosError {
  const config = { headers: new AxiosHeaders() }
  const response = { status, data, statusText: "", headers: {}, config } as AxiosResponse
  return new AxiosError("Request failed", code, config, {}, response)
}

describe("mensajeError", () => {
  it("usa el mensaje del backend", () => {
    expect(mensajeError(errorHttp(409, { message: "Ya existe un registro con código \"X\"." }))).toBe(
      'Ya existe un registro con código "X".',
    )
  })

  it("explica que Render está despertando", () => {
    expect(mensajeError(errorHttp(502, "<html>Bad gateway</html>"))).toMatch(/se está iniciando/)
  })

  it("explica la falta de conexión", () => {
    const sinRespuesta = new AxiosError("Network Error", "ERR_NETWORK", { headers: new AxiosHeaders() })
    expect(mensajeError(sinRespuesta)).toMatch(/No se pudo conectar|No tienes conexión/)
  })

  it("explica el timeout", () => {
    const timeout = new AxiosError("timeout", "ECONNABORTED", { headers: new AxiosHeaders() })
    expect(mensajeError(timeout)).toMatch(/tardó demasiado/)
  })

  it("da un texto por estado cuando el backend no manda mensaje", () => {
    expect(mensajeError(errorHttp(403))).toBe("No tienes permisos para realizar esta acción.")
    expect(mensajeError(errorHttp(404))).toMatch(/No se encontró/)
  })

  it("usa el texto por defecto en errores desconocidos", () => {
    expect(mensajeError(errorHttp(400), "Revisa los datos.")).toBe("Revisa los datos.")
  })
})

describe("mensajeConCausa", () => {
  it("añade la causa al contexto de la pantalla", () => {
    expect(mensajeConCausa(errorHttp(403), "No se pudieron cargar los reclamos")).toBe(
      "No se pudieron cargar los reclamos. No tienes permisos para realizar esta acción.",
    )
  })

  it("no agrega nada si no hay causa", () => {
    expect(mensajeConCausa(errorHttp(400), "No se pudo guardar.")).toBe("No se pudo guardar.")
  })
})
