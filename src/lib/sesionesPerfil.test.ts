import { beforeEach, describe, expect, it } from "vitest"
import { iniciarSesionCliente, leerSesionCliente, marcarPerfilCompleto } from "./sesiones"

describe("sesión del cliente y datos de la empresa (v3.4)", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("la sesión con correo y contraseña tiene la empresa completa", () => {
    iniciarSesionCliente("tok", "Minera")
    expect(leerSesionCliente()?.perfilCompleto).toBe(true)
  })

  it("una cuenta de Google sin empresa queda marcada y se completa después", () => {
    iniciarSesionCliente("tok", "Gina", false)
    expect(leerSesionCliente()?.perfilCompleto).toBe(false)
    marcarPerfilCompleto("Gina Paz")
    expect(leerSesionCliente()).toEqual({ nombre: "Gina Paz", rol: "CLIENTE", perfilCompleto: true })
  })

  it("una sesión guardada antes de la v3.4 (sin el dato) cuenta como completa", () => {
    localStorage.setItem("cliente_access_token", "tok")
    sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ nombre: "Antes", rol: "CLIENTE" }))
    expect(leerSesionCliente()?.perfilCompleto).toBe(true)
  })
})
