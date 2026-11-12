import { beforeEach, describe, expect, it } from "vitest"
import { iniciarSesionCliente, leerSesionCliente, puedeEntrarAlPortal } from "./sesiones"

describe("sesión del cliente (FE-A)", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it("abre la sesión del cliente con su propio token", () => {
    expect(iniciarSesionCliente("tok", "Minera Andina")).toBe(true)
    expect(localStorage.getItem("cliente_access_token")).toBe("tok")
    expect(leerSesionCliente()).toEqual({ nombre: "Minera Andina", rol: "CLIENTE" })
    expect(puedeEntrarAlPortal()).toBe(true)
  })

  it("al abrir la sesión del cliente cierra la interna", () => {
    localStorage.setItem("access_token", "interno")
    localStorage.setItem("refresh_token", "refresh")
    sessionStorage.setItem("genlogs-auth", "{}")
    iniciarSesionCliente("tok", "Cliente")
    expect(localStorage.getItem("access_token")).toBeNull()
    expect(localStorage.getItem("refresh_token")).toBeNull()
    expect(sessionStorage.getItem("genlogs-auth")).toBeNull()
  })

  it("no deja entrar al portal con una sesión de otro rol o con sesión interna", () => {
    localStorage.setItem("cliente_access_token", "tok")
    sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ nombre: "X", rol: "JEFE_ADMINISTRATIVO" }))
    expect(puedeEntrarAlPortal()).toBe(false)

    iniciarSesionCliente("tok", "Cliente")
    localStorage.setItem("access_token", "interno")
    expect(puedeEntrarAlPortal()).toBe(false)
  })

  it("sin token no hay sesión de cliente", () => {
    sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ rol: "CLIENTE" }))
    expect(leerSesionCliente()).toBeNull()
  })
})
