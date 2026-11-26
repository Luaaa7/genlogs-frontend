import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const CUENTA = { nombre: "Luana Barrientos", correo: "luana@empresa.pe", perfilCompleto: true, empresa: "Minera Los Andes S.A.C." }

// QueryClient de la última prueba: permite comprobar qué queda en el caché.
let clienteDeConsultas: import("@tanstack/react-query").QueryClient

async function renderLayout(vitrina: boolean, conSesion: boolean, cuenta: unknown = CUENTA) {
  if (conSesion) {
    localStorage.setItem("cliente_access_token", "token")
    sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ nombre: "Luana Barrientos", rol: "CLIENTE" }))
  }
  vi.resetModules()
  vi.doMock("@/lib/interruptores", () => ({ vitrinaHabilitada: vitrina }))
  // El menú de cuenta pide los datos de la cuenta (correo y empresa): se simulan.
  vi.doMock("@/features/acceso-cliente/api/ingresoGoogleApi", () => ({
    obtenerCuentaPortal: vi.fn(() => (cuenta instanceof Error ? Promise.reject(cuenta) : Promise.resolve(cuenta))),
  }))
  const { QueryClient, QueryClientProvider } = await import("@tanstack/react-query")
  const { ClienteLayout } = await import("./ClienteLayout")
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  clienteDeConsultas = cliente
  return render(<QueryClientProvider client={cliente}><MemoryRouter><ClienteLayout /></MemoryRouter></QueryClientProvider>)
}

// El pie repite Ayuda y Contacto, así que el menú de arriba se consulta por separado.
const menu = () => within(screen.getByRole("navigation", { name: "Portal del cliente" }))
const abrirSoporte = () => fireEvent.click(screen.getByRole("button", { name: "Soporte" }))
const soporte = () => within(screen.getByRole("group", { name: "Soporte" }))
const abrirCuenta = () => fireEvent.click(screen.getByRole("button", { name: "Menú de cuenta" }))
const cuentaMenu = () => within(screen.getByRole("group", { name: "Cuenta" }))
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
  afterEach(() => {
    vi.doUnmock("@/lib/interruptores")
    vi.doUnmock("@/features/acceso-cliente/api/ingresoGoogleApi")
  })

  describe("impresión", () => {
    it("la barra superior y el pie no salen al imprimir", async () => {
      await renderLayout(false, true)
      expect(screen.getByRole("banner").className).toContain("print:hidden")
      expect(screen.getByRole("contentinfo").className).toContain("print:hidden")
    })
  })

  describe("indicador de cotización (carrito compartido)", () => {
    const sembrar = (n: number) =>
      localStorage.setItem("genlogs_public_cart", JSON.stringify(Array.from({ length: n }, (_, i) => ({ id: i + 1, nombre: `Repuesto ${i + 1}`, marca: "CAT", numeroParte: `P${i}`, cantidad: 3 }))))

    it("con el carrito vacío no muestra el botón, ni en la barra ni en el panel móvil", async () => {
      await renderLayout(false, true)
      expect(screen.queryByRole("link", { name: /^Cotización/ })).toBeNull()
      abrirHamburguesa()
      expect(screen.queryByRole("link", { name: /^Cotización/ })).toBeNull()
    })

    it("con repuestos muestra «Cotización (N)» con los repuestos distintos y lleva a la solicitud", async () => {
      sembrar(2)
      await renderLayout(false, true)
      const pildora = screen.getByRole("link", { name: "Cotización (2)" })
      expect(pildora.getAttribute("href")).toBe("/portal/solicitud")
      expect(pildora.className).toMatch(/dorado/)
      expect(pildora.className).toMatch(/dark:/)
    })

    it("va en la barra de escritorio, junto al menú de cuenta, y no despliega ningún panel flotante", async () => {
      sembrar(1)
      await renderLayout(false, true)
      const pildora = screen.getByRole("link", { name: "Cotización (1)" })
      expect(pildora.className).toContain("lg:inline-flex")
      expect(pildora.className).toContain("hidden")
      expect(pildora.parentElement).toBe(screen.getByRole("button", { name: "Menú de cuenta" }).closest("div[class*='relative']")?.parentElement)
      expect(screen.queryByRole("dialog")).toBeNull()
    })

    it("en el panel móvil también aparece, y al elegirlo el panel se cierra", async () => {
      sembrar(3)
      await renderLayout(false, true)
      abrirHamburguesa()
      const enlace = drawer().getByRole("link", { name: "Cotización (3)" })
      expect(enlace.getAttribute("href")).toBe("/portal/solicitud")
      fireEvent.click(enlace)
      expect(screen.queryByRole("navigation", { name: "Menú del portal" })).toBeNull()
    })

    it("se actualiza solo cuando cambia el carrito y desaparece al vaciarlo", async () => {
      sembrar(1)
      await renderLayout(false, true)
      expect(screen.getByRole("link", { name: "Cotización (1)" })).toBeTruthy()
      const { agregarAlCarrito, vaciarCarrito } = await import("@/lib/carritoPublico")
      act(() => { agregarAlCarrito({ id: 99, nombre: "Otro", marca: "CAT", numeroParte: "X" }) })
      expect(screen.getByRole("link", { name: "Cotización (2)" })).toBeTruthy()
      act(() => vaciarCarrito())
      expect(screen.queryByRole("link", { name: /^Cotización/ })).toBeNull()
    })

    it("sin sesión (ingreso y registro) no se muestra", async () => {
      sembrar(2)
      await renderLayout(false, false)
      expect(screen.queryByRole("link", { name: /^Cotización/ })).toBeNull()
    })
  })

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

    it("«Soporte», el tema y el menú de cuenta van juntos a la derecha", async () => {
      await renderLayout(false, true)
      const tema = screen.getByRole("button", { name: "Cambiar a tema oscuro" })
      const cuenta = screen.getByRole("button", { name: "Menú de cuenta" })
      const soporteBoton = screen.getByRole("button", { name: "Soporte" })
      expect(tema.parentElement).toBe(cuenta.closest("div[class*='relative']")?.parentElement)
      expect(soporteBoton.closest("div[class*='relative']")?.parentElement).toBe(tema.parentElement)
    })

    it("ya no deja «Cerrar sesión» suelto en la barra: está dentro del menú de cuenta", async () => {
      await renderLayout(false, true)
      expect(screen.queryByRole("button", { name: "Cerrar sesión" })).toBeNull()
    })

    it("el botón de cuenta muestra el avatar con iniciales y el nombre, y es solo de escritorio", async () => {
      await renderLayout(false, true)
      const boton = screen.getByRole("button", { name: "Menú de cuenta" })
      expect(boton.getAttribute("aria-expanded")).toBe("false")
      expect(boton.textContent).toContain("LB")
      expect(boton.textContent).toContain("Luana Barrientos")
      expect(boton.closest("div[class*='relative']")?.className).toContain("hidden")
      expect(boton.closest("div[class*='relative']")?.className).toContain("lg:block")
    })

    it("con la empresa cargada, el botón la muestra bajo el nombre", async () => {
      await renderLayout(false, true)
      expect(await screen.findByText("Minera Los Andes S.A.C.", { selector: "button *" })).toBeTruthy()
    })

    it("sin nombre en la sesión usa un icono de usuario en lugar de iniciales", async () => {
      localStorage.setItem("cliente_access_token", "token")
      sessionStorage.setItem("genlogs-cliente-auth", JSON.stringify({ nombre: "", rol: "CLIENTE" }))
      vi.resetModules()
      vi.doMock("@/lib/interruptores", () => ({ vitrinaHabilitada: false }))
      vi.doMock("@/features/acceso-cliente/api/ingresoGoogleApi", () => ({ obtenerCuentaPortal: vi.fn(() => new Promise(() => {})) }))
      const { QueryClient, QueryClientProvider } = await import("@tanstack/react-query")
      const { ClienteLayout } = await import("./ClienteLayout")
      render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><ClienteLayout /></MemoryRouter></QueryClientProvider>)
      const boton = screen.getByRole("button", { name: "Menú de cuenta" })
      expect(boton.querySelector("svg")).toBeTruthy()
    })

    it("al abrirlo muestra nombre, correo y empresa, «Mi perfil» y «Cerrar sesión»", async () => {
      await renderLayout(false, true)
      abrirCuenta()

      expect(screen.getByRole("button", { name: "Menú de cuenta" }).getAttribute("aria-expanded")).toBe("true")
      expect(await cuentaMenu().findByText("luana@empresa.pe")).toBeTruthy()
      expect(cuentaMenu().getByText("Luana Barrientos")).toBeTruthy()
      expect(cuentaMenu().getByText("Minera Los Andes S.A.C.")).toBeTruthy()
      expect(cuentaMenu().getByRole("link", { name: "Mi perfil" }).getAttribute("href")).toBe("/portal/perfil")
      expect(cuentaMenu().getByRole("button", { name: "Cerrar sesión" })).toBeTruthy()
    })

    it("si la cuenta aún no carga o falla, el menú igual abre con el nombre de la sesión y las dos opciones", async () => {
      await renderLayout(false, true, new Error("500"))
      abrirCuenta()
      expect(cuentaMenu().getByText("Luana Barrientos")).toBeTruthy()
      expect(cuentaMenu().getByRole("link", { name: "Mi perfil" })).toBeTruthy()
      expect(cuentaMenu().getByRole("button", { name: "Cerrar sesión" })).toBeTruthy()
    })

    it("una cuenta sin empresa no inventa el dato", async () => {
      await renderLayout(false, true, { ...CUENTA, perfilCompleto: false, empresa: null })
      abrirCuenta()
      await cuentaMenu().findByText("luana@empresa.pe")
      expect(cuentaMenu().queryByText("Minera Los Andes S.A.C.")).toBeNull()
    })

    it("«Cerrar sesión» del menú de cuenta termina la sesión del cliente", async () => {
      await renderLayout(false, true)
      abrirCuenta()
      fireEvent.click(cuentaMenu().getByRole("button", { name: "Cerrar sesión" }))
      expect(localStorage.getItem("cliente_access_token")).toBeNull()
    })

    it("al cerrar sesión se borra la cuenta guardada en caché (otra persona no ve datos ajenos)", async () => {
      await renderLayout(false, true)
      await waitFor(() => expect(clienteDeConsultas.getQueryData(["portal-cuenta"])).toBeTruthy())
      abrirCuenta()
      fireEvent.click(cuentaMenu().getByRole("button", { name: "Cerrar sesión" }))
      expect(clienteDeConsultas.getQueryData(["portal-cuenta"])).toBeUndefined()
    })

    it("con Escape el foco vuelve al botón de cuenta", async () => {
      await renderLayout(false, true)
      abrirCuenta()
      fireEvent.keyDown(document, { key: "Escape" })
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Menú de cuenta" }))
    })

    it("el menú de cuenta se cierra con Escape, con un clic afuera y al elegir «Mi perfil»", async () => {
      await renderLayout(false, true)

      abrirCuenta()
      fireEvent.keyDown(document, { key: "Escape" })
      expect(screen.queryByRole("group", { name: "Cuenta" })).toBeNull()

      abrirCuenta()
      fireEvent.mouseDown(document.body)
      expect(screen.queryByRole("group", { name: "Cuenta" })).toBeNull()

      abrirCuenta()
      fireEvent.click(cuentaMenu().getByRole("link", { name: "Mi perfil" }))
      expect(screen.queryByRole("group", { name: "Cuenta" })).toBeNull()
    })

    it("abrir «Soporte» cierra el menú de cuenta, y al revés (nunca dos abiertos)", async () => {
      await renderLayout(false, true)
      abrirCuenta()
      abrirSoporte()
      expect(screen.queryByRole("group", { name: "Cuenta" })).toBeNull()
      expect(screen.getByRole("group", { name: "Soporte" })).toBeTruthy()

      abrirCuenta()
      expect(screen.queryByRole("group", { name: "Soporte" })).toBeNull()
      expect(screen.getByRole("group", { name: "Cuenta" })).toBeTruthy()
    })

    it("sin sesión solo muestra Ingresar y Crear cuenta en la barra (PS2), más Soporte", async () => {
      await renderLayout(true, false)
      expect(menu().getByRole("link", { name: "Ingresar" }).getAttribute("href")).toBe("/portal/ingreso")
      expect(menu().getByRole("link", { name: "Crear cuenta" }).getAttribute("href")).toBe("/portal/registro")
      expect(screen.queryByRole("link", { name: "Mis pedidos" })).toBeNull()
      expect(screen.queryByRole("link", { name: "Repuestos" })).toBeNull()
      expect(screen.queryByRole("button", { name: "Cerrar sesión" })).toBeNull()
      expect(screen.queryByRole("button", { name: "Menú de cuenta" })).toBeNull()
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
      expect(drawer().getByRole("link", { name: "Mi perfil" }).getAttribute("href")).toBe("/portal/perfil")
      expect(drawer().getByRole("button", { name: "Cerrar sesión" })).toBeTruthy()
    })

    it("sin sesión el panel no ofrece «Mi perfil»", async () => {
      await renderLayout(true, false)
      abrirHamburguesa()
      expect(drawer().queryByRole("link", { name: "Mi perfil" })).toBeNull()
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

    it("«Cerrar sesión» del panel termina la sesión del cliente y borra la cuenta en caché", async () => {
      await renderLayout(true, true)
      await waitFor(() => expect(clienteDeConsultas.getQueryData(["portal-cuenta"])).toBeTruthy())
      abrirHamburguesa()

      fireEvent.click(drawer().getByRole("button", { name: "Cerrar sesión" }))

      expect(localStorage.getItem("cliente_access_token")).toBeNull()
      expect(clienteDeConsultas.getQueryData(["portal-cuenta"])).toBeUndefined()
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

  describe("barra de progreso superior", () => {
    const barra = () => screen.queryByRole("progressbar", { name: "Cargando" })

    it("va pegada al borde inferior de la barra de navegación", async () => {
      await renderLayout(false, true)
      await waitFor(() => expect(barra()).toBeNull())
      act(() => {
        void clienteDeConsultas.fetchQuery({ queryKey: ["lenta"], queryFn: () => new Promise<string>(() => {}) })
      })
      await waitFor(() => expect(barra()).not.toBeNull())
      expect(barra()?.parentElement).toBe(screen.getByRole("banner"))
      expect(screen.getByRole("banner").className).toContain("relative")
    })

    it("se oculta cuando no hay cargas activas", async () => {
      await renderLayout(false, true)
      await waitFor(() => expect(barra()).toBeNull())
    })

    it("aparece mientras hay una consulta cargando y se va al terminar", async () => {
      await renderLayout(false, true)
      await waitFor(() => expect(barra()).toBeNull())

      let terminar: (valor: string) => void = () => {}
      act(() => {
        void clienteDeConsultas.fetchQuery({ queryKey: ["lenta"], queryFn: () => new Promise<string>((resolver) => { terminar = resolver }) })
      })
      await waitFor(() => expect(barra()).not.toBeNull())

      act(() => terminar("listo"))
      await waitFor(() => expect(barra()).toBeNull())
    })

    it("también se activa un momento al navegar a otra sección", async () => {
      await renderLayout(false, true)
      await waitFor(() => expect(barra()).toBeNull())

      fireEvent.click(menu().getByRole("link", { name: "Mis cotizaciones" }))

      expect(barra()).not.toBeNull()
      await waitFor(() => expect(barra()).toBeNull())
    })

    it("sin sesión también existe (ingreso y registro cargan datos)", async () => {
      await renderLayout(false, false)
      await waitFor(() => expect(barra()).toBeNull())
      act(() => {
        void clienteDeConsultas.fetchQuery({ queryKey: ["lenta"], queryFn: () => new Promise<string>(() => {}) })
      })
      await waitFor(() => expect(barra()).not.toBeNull())
    })
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
