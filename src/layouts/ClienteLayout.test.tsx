import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

async function renderLayout(vitrina: boolean, conSesion: boolean) {
  if (conSesion) {
    localStorage.setItem("cliente_access_token", "token")
    sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ nombre: "Cliente", rol: "CLIENTE" }))
  }
  vi.resetModules()
  vi.doMock("@/lib/interruptores", () => ({ vitrinaHabilitada: vitrina }))
  const { ClienteLayout } = await import("./ClienteLayout")
  return render(<MemoryRouter><ClienteLayout /></MemoryRouter>)
}

describe("Menú del portal del cliente", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  afterEach(() => vi.doUnmock("@/lib/interruptores"))

  it("con sesión muestra Mis pedidos, Mis cotizaciones, Mis comprobantes, Nueva solicitud, Reclamos y Cerrar sesión", async () => {
    await renderLayout(false, true)
    expect(screen.getByRole("link", { name: "Mis pedidos" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Mis cotizaciones" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Mis comprobantes" }).getAttribute("href")).toBe("/portal/comprobantes")
    expect(screen.getByRole("link", { name: "Nueva solicitud" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Reclamos" }).getAttribute("href")).toBe("/portal/reclamos")
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeTruthy()
  })

  it("sin sesión solo muestra Ingresar y Crear cuenta (PS2)", async () => {
    await renderLayout(true, false)
    expect(screen.getByRole("link", { name: "Ingresar" }).getAttribute("href")).toBe("/portal/ingreso")
    expect(screen.getByRole("link", { name: "Crear cuenta" }).getAttribute("href")).toBe("/portal/registro")
    expect(screen.queryByRole("link", { name: "Mis pedidos" })).toBeNull()
    expect(screen.queryByRole("link", { name: "Mis comprobantes" })).toBeNull()
    expect(screen.queryByRole("link", { name: "Repuestos" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Cerrar sesión" })).toBeNull()
  })

  it("con sesión y la vitrina apagada no muestra Repuestos", async () => {
    await renderLayout(false, true)
    expect(screen.queryByRole("link", { name: "Repuestos" })).toBeNull()
  })

  it("con sesión y la vitrina encendida muestra Repuestos (#59 de Nicole)", async () => {
    await renderLayout(true, true)
    const enlace = screen.getByRole("link", { name: "Repuestos" })
    expect(enlace.getAttribute("href")).toBe("/portal/repuestos")
  })

  it.each([[true], [false]])("con sesión = %s muestra Ayuda y Contáctame (v3.4, K2)", async (conSesion) => {
    await renderLayout(false, conSesion)
    expect(screen.getByRole("link", { name: "Ayuda" }).getAttribute("href")).toBe("/ayuda")
    expect(screen.getByRole("link", { name: "Contáctame" }).getAttribute("href")).toBe("/contacto")
  })
})