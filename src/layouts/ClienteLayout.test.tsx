import { fireEvent, render, screen, within } from "@testing-library/react"
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

// El pie repite Ayuda y Contacto, así que el menú de arriba se consulta por separado.
const menu = () => within(screen.getByRole("navigation", { name: "Portal del cliente" }))

describe("Menú del portal del cliente", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    document.documentElement.classList.remove("dark")
  })
  afterEach(() => vi.doUnmock("@/lib/interruptores"))

  it("con sesión muestra Mis pedidos, Mis cotizaciones, Mis comprobantes, Nueva solicitud, Reclamos y Cerrar sesión", async () => {
    await renderLayout(false, true)
    expect(screen.getByRole("link", { name: "Mis pedidos" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Mis cotizaciones" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Mis comprobantes" }).getAttribute("href")).toBe("/portal/comprobantes")
    const nueva = screen.getByRole("link", { name: "Nueva solicitud" })
    expect(nueva.getAttribute("href")).toBe("/portal/solicitud")
    // v3.4: «Nueva solicitud» va justo antes de «Cerrar sesión», a la derecha de los demás enlaces.
    const cerrar = screen.getByRole("button", { name: "Cerrar sesión" })
    expect(nueva.compareDocumentPosition(cerrar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(menu().getByRole("link", { name: "Contacto" }).compareDocumentPosition(nueva) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
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

  it.each([[true], [false]])("con sesión = %s muestra Ayuda y Contacto (v3.4, K2)", async (conSesion) => {
    await renderLayout(false, conSesion)
    expect(menu().getByRole("link", { name: "Ayuda" }).getAttribute("href")).toBe("/ayuda")
    expect(menu().getByRole("link", { name: "Contacto" }).getAttribute("href")).toBe("/contacto")
  })

  it("«Nueva solicitud» es un enlace más del menú, sin borde propio", async () => {
    await renderLayout(false, true)
    const nueva = screen.getByRole("link", { name: "Nueva solicitud" })
    expect(nueva.className).not.toMatch(/(^|\s)border(\s|$)/)
    expect(nueva.className).not.toContain("border-primary")
  })

  it.each([[true], [false]])("con sesión = %s muestra el botón de tema y lo alterna con la misma clave de la landing", async (conSesion) => {
    await renderLayout(false, conSesion)
    fireEvent.click(screen.getByRole("button", { name: "Cambiar a tema oscuro" }))
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(localStorage.getItem("genlogs-theme")).toBe("dark")
    fireEvent.click(screen.getByRole("button", { name: "Cambiar a tema claro" }))
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(localStorage.getItem("genlogs-theme")).toBe("light")
  })

  it("si la landing dejó el tema oscuro guardado, el portal lo mantiene", async () => {
    localStorage.setItem("genlogs-theme", "dark")
    await renderLayout(false, true)
    expect(screen.getByRole("button", { name: "Cambiar a tema claro" })).toBeTruthy()
  })

  it("el botón de tema va junto a «Cerrar sesión»", async () => {
    await renderLayout(false, true)
    const tema = screen.getByRole("button", { name: "Cambiar a tema oscuro" })
    const cerrar = screen.getByRole("button", { name: "Cerrar sesión" })
    expect(tema.parentElement).toBe(cerrar.parentElement)
  })

  it.each([[true], [false]])("con sesión = %s muestra el pie institucional con Ayuda y Contacto", async (conSesion) => {
    await renderLayout(false, conSesion)
    const pie = screen.getByRole("contentinfo")
    expect(pie.textContent).toContain(`© ${new Date().getFullYear()} GenLogs S.A.C. Soluciones para minería.`)
    const enlaces = screen.getByRole("navigation", { name: "Enlaces del pie" })
    expect(enlaces.querySelector('a[href="/ayuda"]')?.textContent).toBe("Ayuda")
    expect(enlaces.querySelector('a[href="/contacto"]')?.textContent).toBe("Contacto")
  })

  it.each([[true], [false]])("con sesión = %s el logo y el menú van en la misma fila, sin saltar de línea", async (conSesion) => {
    await renderLayout(false, conSesion)
    const logo = screen.getByRole("img", { name: "GenLogs S.A.C." }).closest("a") as HTMLElement
    const nav = screen.getByRole("navigation", { name: "Portal del cliente" })
    const fila = logo.parentElement as HTMLElement
    expect(nav.parentElement).toBe(fila)
    expect(fila.className).toContain("items-center")
    expect(fila.className).toContain("justify-between")
    expect(fila.className).not.toContain("flex-wrap")
    expect(logo.className).toContain("shrink-0")
    expect(nav.className).toContain("min-w-0")
    expect(screen.getByRole("link", { name: conSesion ? "Mis pedidos" : "Ingresar" }).className).toContain("whitespace-nowrap")
  })
})
