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
const abrirSoporte = () => fireEvent.click(screen.getByRole("button", { name: "Soporte" }))
const soporte = () => within(screen.getByRole("group", { name: "Soporte" }))
const abrirHamburguesa = () => fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }))
const drawer = () => within(screen.getByRole("navigation", { name: "Menú del portal" }))

const SECCIONES = [
  ["Mis pedidos", "/portal/pedidos"],
  ["Mis cotizaciones", "/portal/cotizaciones"],
  ["Mis comprobantes", "/portal/comprobantes"],
  ["Mis despachos", "/portal/despachos"],
] as const

describe("Menú del portal del cliente", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    document.documentElement.classList.remove("dark")
  })
  afterEach(() => vi.doUnmock("@/lib/interruptores"))

  describe("escritorio (lg:flex)", () => {
    it("con sesión deja en la barra 5 secciones, con Repuestos si la vitrina está encendida (Reclamos va en Soporte)", async () => {
      await renderLayout(true, true)
      const nombres = menu().getAllByRole("link").map((enlace) => enlace.textContent)
      expect(nombres).toEqual(["Mis pedidos", "Mis cotizaciones", "Mis comprobantes", "Mis despachos", "Repuestos"])
      for (const [nombre, ruta] of SECCIONES) expect(menu().getByRole("link", { name: nombre }).getAttribute("href")).toBe(ruta)
      expect(menu().getByRole("link", { name: "Repuestos" }).getAttribute("href")).toBe("/portal/repuestos")
    })

    it("con la vitrina apagada no muestra Repuestos (quedan 4)", async () => {
      await renderLayout(false, true)
      expect(menu().queryByRole("link", { name: "Repuestos" })).toBeNull()
      expect(menu().getAllByRole("link")).toHaveLength(4)
      expect(menu().queryByRole("link", { name: "Reclamos" })).toBeNull()
    })

    it("la barra es de escritorio: oculta hasta lg, sin overflow-x-auto en toda la cabecera", async () => {
      await renderLayout(true, true)
      const nav = screen.getByRole("navigation", { name: "Portal del cliente" })
      expect(nav.className).toContain("hidden")
      expect(nav.className).toContain("lg:flex")
      expect(nav.className).toContain("text-sm")
      expect(screen.getByRole("banner").innerHTML).not.toContain("overflow-x-auto")
    })

    it("no repite «Nueva solicitud» en la barra (cada vista tiene su botón amarillo)", async () => {
      await renderLayout(true, true)
      expect(screen.queryByRole("link", { name: "Nueva solicitud" })).toBeNull()
    })

    it("Reclamos, Ayuda y Contacto van agrupados en el desplegable «Soporte»", async () => {
      await renderLayout(false, true)
      const boton = screen.getByRole("button", { name: "Soporte" })
      expect(boton.getAttribute("aria-expanded")).toBe("false")
      expect(menu().queryByRole("link", { name: "Ayuda" })).toBeNull()

      abrirSoporte()

      expect(boton.getAttribute("aria-expanded")).toBe("true")
      expect(soporte().getAllByRole("link").map((e) => e.textContent)).toEqual(["Reclamos", "Ayuda", "Contacto"])
      expect(soporte().getByRole("link", { name: "Reclamos" }).getAttribute("href")).toBe("/portal/reclamos")
      expect(soporte().getByRole("link", { name: "Ayuda" }).getAttribute("href")).toBe("/ayuda")
      expect(soporte().getByRole("link", { name: "Contacto" }).getAttribute("href")).toBe("/contacto")
    })

    it("«Soporte» se cierra con Escape, con un clic afuera y al elegir un enlace", async () => {
      await renderLayout(false, true)

      abrirSoporte()
      fireEvent.keyDown(document, { key: "Escape" })
      expect(screen.queryByRole("group", { name: "Soporte" })).toBeNull()

      abrirSoporte()
      fireEvent.mouseDown(document.body)
      expect(screen.queryByRole("group", { name: "Soporte" })).toBeNull()

      abrirSoporte()
      fireEvent.click(soporte().getByRole("link", { name: "Ayuda" }))
      expect(screen.queryByRole("group", { name: "Soporte" })).toBeNull()
    })

    it("«Soporte», el tema y «Cerrar sesión» van juntos a la derecha", async () => {
      await renderLayout(false, true)
      const tema = screen.getByRole("button", { name: "Cambiar a tema oscuro" })
      const cerrar = screen.getByRole("button", { name: "Cerrar sesión" })
      const soporteBoton = screen.getByRole("button", { name: "Soporte" })
      expect(tema.parentElement).toBe(cerrar.parentElement)
      expect(soporteBoton.closest("div[class*='relative']")?.parentElement).toBe(cerrar.parentElement)
    })

    it("sin sesión solo muestra Ingresar y Crear cuenta en la barra (PS2), más Soporte", async () => {
      await renderLayout(true, false)
      expect(menu().getByRole("link", { name: "Ingresar" }).getAttribute("href")).toBe("/portal/ingreso")
      expect(menu().getByRole("link", { name: "Crear cuenta" }).getAttribute("href")).toBe("/portal/registro")
      expect(screen.queryByRole("link", { name: "Mis pedidos" })).toBeNull()
      expect(screen.queryByRole("link", { name: "Repuestos" })).toBeNull()
      expect(screen.queryByRole("button", { name: "Cerrar sesión" })).toBeNull()
      abrirSoporte()
      expect(soporte().getByRole("link", { name: "Contacto" })).toBeTruthy()
    })
  })

  describe("celular, tableta y laptops chicas (lg:hidden)", () => {
    it("la hamburguesa abre un panel vertical con todas las rutas del portal", async () => {
      await renderLayout(true, true)
      const boton = screen.getByRole("button", { name: "Abrir menú" })
      expect(boton.className).toContain("lg:hidden")
      expect(boton.getAttribute("aria-expanded")).toBe("false")
      expect(screen.queryByRole("navigation", { name: "Menú del portal" })).toBeNull()

      fireEvent.click(boton)

      expect(screen.getByRole("button", { name: "Cerrar menú" }).getAttribute("aria-expanded")).toBe("true")
      for (const [nombre, ruta] of SECCIONES) expect(drawer().getByRole("link", { name: nombre }).getAttribute("href")).toBe(ruta)
      expect(drawer().getByRole("link", { name: "Repuestos" }).getAttribute("href")).toBe("/portal/repuestos")
      expect(drawer().getByRole("link", { name: "Nueva solicitud" }).getAttribute("href")).toBe("/portal/solicitud")
      expect(drawer().getByRole("link", { name: "Ayuda" }).getAttribute("href")).toBe("/ayuda")
      expect(drawer().getByRole("link", { name: "Contacto" }).getAttribute("href")).toBe("/contacto")
      expect(drawer().getByRole("button", { name: "Cerrar sesión" })).toBeTruthy()
    })

    it("el panel no tiene scroll horizontal (solo vertical) y es solo para pantallas chicas", async () => {
      await renderLayout(true, true)
      abrirHamburguesa()
      const panel = screen.getByRole("navigation", { name: "Menú del portal" })
      expect(panel.className).toContain("lg:hidden")
      expect(panel.className).toContain("overflow-y-auto")
      expect(panel.className).not.toContain("overflow-x-auto")
    })

    it("con la vitrina apagada el panel no muestra Repuestos", async () => {
      await renderLayout(false, true)
      abrirHamburguesa()
      expect(drawer().queryByRole("link", { name: "Repuestos" })).toBeNull()
    })

    it("se cierra con la hamburguesa, con Escape y al elegir una ruta", async () => {
      await renderLayout(true, true)

      abrirHamburguesa()
      fireEvent.click(screen.getByRole("button", { name: "Cerrar menú" }))
      expect(screen.queryByRole("navigation", { name: "Menú del portal" })).toBeNull()

      abrirHamburguesa()
      fireEvent.keyDown(document, { key: "Escape" })
      expect(screen.queryByRole("navigation", { name: "Menú del portal" })).toBeNull()

      abrirHamburguesa()
      fireEvent.click(drawer().getByRole("link", { name: "Reclamos" }))
      expect(screen.queryByRole("navigation", { name: "Menú del portal" })).toBeNull()
    })

    it("«Cerrar sesión» del panel termina la sesión del cliente", async () => {
      await renderLayout(true, true)
      abrirHamburguesa()

      fireEvent.click(drawer().getByRole("button", { name: "Cerrar sesión" }))

      expect(localStorage.getItem("cliente_access_token")).toBeNull()
    })

    it("sin sesión el panel ofrece Ingresar, Crear cuenta, Ayuda y Contacto", async () => {
      await renderLayout(true, false)
      abrirHamburguesa()
      expect(drawer().getByRole("link", { name: "Ingresar" }).getAttribute("href")).toBe("/portal/ingreso")
      expect(drawer().getByRole("link", { name: "Crear cuenta" }).getAttribute("href")).toBe("/portal/registro")
      expect(drawer().getByRole("link", { name: "Ayuda" }).getAttribute("href")).toBe("/ayuda")
      expect(drawer().getByRole("link", { name: "Contacto" }).getAttribute("href")).toBe("/contacto")
      expect(drawer().queryByRole("link", { name: "Mis pedidos" })).toBeNull()
    })
  })

  it.each([[true], [false]])("con sesión = %s el botón de tema alterna con la misma clave de la landing", async (conSesion) => {
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

  it("el botón de tema sigue visible en pantallas chicas, junto a la hamburguesa", async () => {
    await renderLayout(false, true)
    const tema = screen.getByRole("button", { name: "Cambiar a tema oscuro" })
    expect(tema.className).not.toContain("hidden")
    expect(tema.parentElement).toBe(screen.getByRole("button", { name: "Abrir menú" }).parentElement)
  })

  it.each([[true], [false]])("con sesión = %s el logo y la barra van en la misma fila, sin saltar de línea", async (conSesion) => {
    await renderLayout(false, conSesion)
    const logo = screen.getByRole("img", { name: "GenLogs S.A.C." }).closest("a") as HTMLElement
    const nav = screen.getByRole("navigation", { name: "Portal del cliente" })
    const fila = logo.parentElement as HTMLElement
    expect(nav.parentElement).toBe(fila)
    expect(fila.className).toContain("items-center")
    expect(fila.className).toContain("justify-between")
    expect(fila.className).not.toContain("flex-wrap")
    expect(logo.className).toContain("shrink-0")
    expect(menu().getByRole("link", { name: conSesion ? "Mis pedidos" : "Ingresar" }).className).toContain("whitespace-nowrap")
  })

  it.each([[true], [false]])("con sesión = %s muestra el pie institucional con Ayuda y Contacto", async (conSesion) => {
    await renderLayout(false, conSesion)
    const pie = screen.getByRole("contentinfo")
    expect(pie.textContent).toContain(`© ${new Date().getFullYear()} GenLogs S.A.C. Soluciones para minería.`)
    const enlaces = screen.getByRole("navigation", { name: "Enlaces del pie" })
    expect(enlaces.querySelector('a[href="/ayuda"]')?.textContent).toBe("Ayuda")
    expect(enlaces.querySelector('a[href="/contacto"]')?.textContent).toBe("Contacto")
  })
})
