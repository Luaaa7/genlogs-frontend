import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { axiosClient } from "./axiosClient"

const adaptadorOriginal = axiosClient.defaults.adapter

/** Respuestas simuladas del backend, en orden; cada una es un estado HTTP o un cuerpo 200. */
function responder(...estados: number[]) {
  const adaptador: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    const status = estados.shift() ?? 200
    const respuesta = { data: {}, status, statusText: "", headers: {}, config }
    if (status >= 400) throw new AxiosError("fallo", "ERR_BAD_REQUEST", config, null, respuesta)
    return respuesta
  }
  axiosClient.defaults.adapter = adaptador
}

function ubicar(pathname: string, search = "") {
  const ubicacion = { pathname, search, href: "" }
  vi.stubGlobal("location", ubicacion)
  return ubicacion
}

describe("axiosClient: sesión vencida (401)", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.spyOn(console, "warn").mockImplementation(() => {})
  })
  afterEach(() => {
    axiosClient.defaults.adapter = adaptadorOriginal
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("portal: un 401 cierra la sesión del cliente y va al ingreso con ?volver= y ?motivo=sesion-expirada", async () => {
    const ubicacion = ubicar("/portal/pedidos", "?p=2")
    localStorage.setItem("cliente_access_token", "tok")
    sessionStorage.setItem("genlogs-cliente-auth", "{}")
    responder(401)

    await expect(axiosClient.get("/portal/pedidos")).rejects.toBeTruthy()

    expect(localStorage.getItem("cliente_access_token")).toBeNull()
    expect(ubicacion.href).toBe("/portal/ingreso?volver=%2Fportal%2Fpedidos%3Fp%3D2&motivo=sesion-expirada")
  })

  it("interno sin refresh_token: va a /login?motivo=sesion-expirada", async () => {
    const ubicacion = ubicar("/clientes")
    localStorage.setItem("access_token", "viejo")
    responder(401)

    await expect(axiosClient.get("/clientes")).rejects.toBeTruthy()

    expect(localStorage.getItem("access_token")).toBeNull()
    expect(ubicacion.href).toBe("/login?motivo=sesion-expirada")
  })

  it("interno con refresh_token: renueva en silencio, repite la petición y no cierra sesión", async () => {
    const ubicacion = ubicar("/clientes")
    localStorage.setItem("access_token", "viejo")
    localStorage.setItem("refresh_token", "r-viejo")
    vi.spyOn(axios, "post").mockResolvedValue({ data: { accessToken: "nuevo", refreshToken: "r-nuevo" } })
    responder(401, 200)

    const respuesta = await axiosClient.get("/clientes")

    expect(respuesta.status).toBe(200)
    expect(localStorage.getItem("access_token")).toBe("nuevo")
    expect(localStorage.getItem("refresh_token")).toBe("r-nuevo")
    expect(ubicacion.href).toBe("")
  })

  it("interno: si el refresh falla, cierra sesión con el aviso de sesión vencida", async () => {
    const ubicacion = ubicar("/clientes")
    localStorage.setItem("access_token", "viejo")
    localStorage.setItem("refresh_token", "r-vencido")
    vi.spyOn(axios, "post").mockRejectedValue(new Error("401"))
    responder(401)

    await expect(axiosClient.get("/clientes")).rejects.toBeTruthy()

    expect(ubicacion.href).toBe("/login?motivo=sesion-expirada")
    expect(localStorage.getItem("refresh_token")).toBeNull()
  })

  it.each(["/auth/login", "/public/repuestos"])("un 401 en %s no es sesión vencida: no redirige", async (ruta) => {
    const ubicacion = ubicar("/login")
    responder(401)
    await expect(axiosClient.post(ruta, {})).rejects.toBeTruthy()
    expect(ubicacion.href).toBe("")
  })

  it("un 403 no cierra sesión ni redirige", async () => {
    const ubicacion = ubicar("/clientes")
    localStorage.setItem("access_token", "vale")
    responder(403)
    await expect(axiosClient.get("/clientes")).rejects.toBeTruthy()
    expect(localStorage.getItem("access_token")).toBe("vale")
    expect(ubicacion.href).toBe("")
  })
})
