import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { RepuestoPortal } from "./repuestosApi"

const api = vi.hoisted(() => ({ listar: vi.fn(), pedirCotizacion: vi.fn() }))
vi.mock("./repuestosApi", () => ({ repuestosApi: api }))
const portal = vi.hoisted(() => ({ listarPedidos: vi.fn(), subirFotoSolicitud: vi.fn() }))
vi.mock("@/api/portalApi", () => ({ portalApi: portal }))

import { RepuestosPage } from "./RepuestosPage"

const filtro: RepuestoPortal = {
  idProducto: 1, nombre: "Filtro de combustible", descripcion: null, marca: "Caterpillar", numeroParte: "1R-0750",
  idCategoria: 3, categoria: "Filtros", unidad: "Unidad", tipoRepuesto: "OEM", plazoEntrega: "5 a 7 días hábiles",
  urlImagen: null, precioReferencial: 568.75, moneda: "PEN",
}
const rodamiento: RepuestoPortal = { ...filtro, idProducto: 2, nombre: "Rodamiento 6205", marca: "SKF", numeroParte: "6205-2RS", idCategoria: 5, categoria: "Rodamientos", precioReferencial: 48.5 }

function pintar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/portal/repuestos"]}>
        <Routes>
          <Route path="/portal/repuestos" element={<RepuestosPage />} />
          <Route path="/portal/pedidos" element={<p>mis pedidos</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("RepuestosPage (RF-82)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    api.listar.mockResolvedValue([filtro, rodamiento])
    portal.listarPedidos.mockResolvedValue([
      { id: 1, fecha: "2026-10-01", estado: "COTIZADA", items: [{ descripcion: "Plancha de desgaste", cantidad: 4, unidad: "Unidad" }] },
    ])
  })

  it("muestra precio referencial y plazo, y filtra por categoría", async () => {
    pintar()
    expect(await screen.findByText("Filtro de combustible")).toBeTruthy()
    expect(screen.getByText(/568\.75/)).toBeTruthy()
    expect(screen.getAllByText("5 a 7 días hábiles").length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole("button", { name: /rodamientos/i }))
    expect(screen.queryByText("Filtro de combustible")).toBeNull()
    expect(screen.getByText("Rodamiento 6205")).toBeTruthy()
  })

  it("el panel «Tu pedido de cotización» dice solo que se enviará la cotización confirmada", async () => {
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /agregar filtro de combustible al pedido/i }))
    const carrito = screen.getByRole("complementary")
    expect(within(carrito).getByText("Te enviamos la cotización con precio y plazo confirmados.")).toBeTruthy()
    expect(within(carrito).queryByText(/los precios son referenciales/i)).toBeNull()
  })

  it("si un repuesto no trae plazo, la tarjeta dice «Plazo según cotización»", async () => {
    api.listar.mockResolvedValue([{ ...filtro, plazoEntrega: "" }, { ...rodamiento, plazoEntrega: null }])
    pintar()
    await screen.findByText("Filtro de combustible")
    expect(screen.getAllByText("Plazo según cotización")).toHaveLength(2)
  })

  it("mientras se envía el pedido, el botón dice «Enviando pedido...» con spinner y queda deshabilitado", async () => {
    api.pedirCotizacion.mockReturnValue(new Promise(() => {}))
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /agregar filtro de combustible al pedido/i }))
    fireEvent.click(within(screen.getByRole("complementary")).getByRole("button", { name: /pedir cotización/i }))

    const boton = await within(screen.getByRole("complementary")).findByRole("button", { name: "Enviando pedido..." })
    expect(boton.hasAttribute("disabled")).toBe(true)
    expect(boton.firstElementChild?.getAttribute("class")).toContain("animate-spin")
  })

  it("arma el carrito con el total referencial y pide la cotización", async () => {
    api.pedirCotizacion.mockResolvedValue({ idSolicitud: 3, codigoSolicitud: "SOL-3", estado: "PENDIENTE" })
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /agregar filtro de combustible al pedido/i }))
    fireEvent.click(screen.getByRole("button", { name: /agregar rodamiento 6205 al pedido/i }))
    fireEvent.change(screen.getByLabelText(/cantidad de rodamiento 6205/i), { target: { value: "2" } })

    const carrito = screen.getByRole("complementary")
    expect(within(carrito).getByText(/665\.75/)).toBeTruthy() // 568.75 + 2 × 48.50

    fireEvent.click(within(carrito).getByRole("button", { name: /pedir cotización/i }))
    await waitFor(() => expect(api.pedirCotizacion).toHaveBeenCalled())
    expect(api.pedirCotizacion.mock.calls[0][0]).toEqual([
      expect.objectContaining({ idProducto: 1, cantidad: 1 }),
      expect.objectContaining({ idProducto: 2, cantidad: 2 }),
    ])
    expect(await screen.findByText("mis pedidos")).toBeTruthy()
    expect(localStorage.getItem("genlogs-carrito-repuestos")).toBeNull()
  })

  it("Lo que ya pediste: Volver a pedir lo agrega al carrito", async () => {
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /volver a pedir plancha de desgaste/i }))
    const carrito = screen.getByRole("complementary")
    expect(within(carrito).getByText("Plancha de desgaste")).toBeTruthy()
    expect((within(carrito).getByLabelText(/cantidad de plancha de desgaste/i) as HTMLInputElement).value).toBe("4")
  })

  it("Volver a pedir: sin N.º de parte con marca, o foto, no deja pedir (D-01)", async () => {
    api.pedirCotizacion.mockResolvedValue({ idSolicitud: 4, codigoSolicitud: "SOL-4", estado: "PENDIENTE" })
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /volver a pedir plancha de desgaste/i }))
    const carrito = screen.getByRole("complementary")
    const pedir = within(carrito).getByRole("button", { name: /pedir cotización/i }) as HTMLButtonElement
    expect(pedir.disabled).toBe(true)
    expect(within(carrito).getByText(/a 1 repuesto le falta/i)).toBeTruthy()

    fireEvent.change(within(carrito).getByLabelText(/n\.º de parte de plancha de desgaste/i), { target: { value: "PD-200" } })
    expect(within(carrito).getByText(/indica la marca/i)).toBeTruthy()
    expect(pedir.disabled).toBe(true)

    fireEvent.change(within(carrito).getByLabelText(/marca de plancha de desgaste/i), { target: { value: "Hardox" } })
    expect(pedir.disabled).toBe(false)
    fireEvent.click(pedir)
    await waitFor(() => expect(api.pedirCotizacion).toHaveBeenCalled())
    expect(api.pedirCotizacion.mock.calls[0][0]).toEqual([
      expect.objectContaining({ descripcion: "Plancha de desgaste", numeroParte: "PD-200", marca: "Hardox", cantidad: 4 }),
    ])
  })

  it("Volver a pedir: con una foto adjunta ya se puede pedir", async () => {
    portal.subirFotoSolicitud.mockResolvedValue("/uploads/solicitudes/plancha.jpg")
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /volver a pedir plancha de desgaste/i }))
    const carrito = screen.getByRole("complementary")
    const archivo = new File(["x"], "plancha.jpg", { type: "image/jpeg" })
    fireEvent.change(within(carrito).getByLabelText(/adjunta foto o plano de plancha de desgaste/i), { target: { files: [archivo] } })
    expect(await within(carrito).findByText(/foto adjunta/i)).toBeTruthy()
    expect(portal.subirFotoSolicitud).toHaveBeenCalledWith(archivo)
    expect((within(carrito).getByRole("button", { name: /pedir cotización/i }) as HTMLButtonElement).disabled).toBe(false)
  })

  it("si no está, ofrece pedirlo por solicitud", async () => {
    api.listar.mockResolvedValue([])
    pintar()
    expect(await screen.findByText(/no encontramos ese repuesto/i)).toBeTruthy()
    expect(screen.getAllByRole("link", { name: /pídelo/i })[0].getAttribute("href")).toBe("/portal/solicitud")
  })

  it("el carrito se conserva al volver a la página", async () => {
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /agregar filtro de combustible al pedido/i }))
    await waitFor(() => expect(localStorage.getItem("genlogs-carrito-repuestos")).toContain("Filtro de combustible"))
  })

  it("marcas en tarjetas: filtra por marca, muestra el conteo y se puede quitar el filtro", async () => {
    pintar()
    const marcas = await screen.findByRole("group", { name: /filtrar por marca/i })
    const skf = within(marcas).getByRole("button", { name: /skf/i })
    expect(skf.textContent).toContain("1 repuesto")
    fireEvent.click(skf)
    expect(skf.getAttribute("aria-pressed")).toBe("true")
    expect(screen.queryByText("Filtro de combustible")).toBeNull()
    expect(screen.getByText("Rodamiento 6205")).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: /quitar marca skf/i }))
    expect(await screen.findByText("Filtro de combustible")).toBeTruthy()
    expect(within(marcas).getByRole("button", { name: /todas las marcas/i }).getAttribute("aria-pressed")).toBe("true")
  })

  it("no limita la cantidad de marcas: «Ver todas las marcas (N)» despliega todas", async () => {
    const muchas = Array.from({ length: 25 }, (_, i) => ({ ...filtro, idProducto: 100 + i, nombre: `Repuesto ${i}`, marca: `Marca ${String(i).padStart(2, "0")}` }))
    api.listar.mockResolvedValue(muchas)
    pintar()
    const marcas = await screen.findByRole("group", { name: /filtrar por marca/i })
    expect(within(marcas).queryByRole("button", { name: /marca 24/i })).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Ver todas las marcas (25)" }))
    expect(within(marcas).getByRole("button", { name: /marca 24/i })).toBeTruthy()
    // 25 marcas + «Todas las marcas»
    expect(within(marcas).getAllByRole("button")).toHaveLength(26)
  })

  it("la tarjeta indica cuánto hay en el pedido y el carrito suma y resta con los botones", async () => {
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /agregar filtro de combustible al pedido/i }))
    expect(screen.getByText(/en tu pedido · 1/i)).toBeTruthy()

    const carrito = screen.getByRole("complementary")
    const cantidad = within(carrito).getByLabelText(/cantidad de filtro de combustible/i) as HTMLInputElement
    const restar = within(carrito).getByRole("button", { name: /restar una unidad a filtro de combustible/i }) as HTMLButtonElement
    expect(restar.disabled).toBe(true)
    fireEvent.click(within(carrito).getByRole("button", { name: /sumar una unidad a filtro de combustible/i }))
    expect(cantidad.value).toBe("2")
    expect(screen.getByText(/en tu pedido · 2/i)).toBeTruthy()
    fireEvent.click(restar)
    expect(cantidad.value).toBe("1")
  })

  it("móvil: la barra del pedido abre el carrito y Escape lo cierra devolviendo el foco", async () => {
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /agregar rodamiento 6205 al pedido/i }))
    const barra = screen.getByRole("button", { name: /ver tu pedido de cotización/i })
    expect(barra.textContent).toContain("1 repuesto")
    expect(barra.getAttribute("aria-expanded")).toBe("false")

    fireEvent.click(barra)
    const cerrar = within(screen.getByRole("complementary")).getByRole("button", { name: /cerrar tu pedido/i })
    expect(document.activeElement).toBe(cerrar)

    fireEvent.keyDown(document, { key: "Escape" })
    await waitFor(() => expect(document.activeElement).toBe(barra))
    expect(barra.getAttribute("aria-expanded")).toBe("false")
  })

  it("la tarjeta separa el tipo y el N.º de parte del nombre del catálogo, y pide con el nombre completo", async () => {
    api.listar.mockResolvedValue([{ ...filtro, idProducto: 30, nombre: "Fusible - Bussmann - FRN-R-20", marca: "Bussmann", numeroParte: null }])
    api.pedirCotizacion.mockResolvedValue({ idSolicitud: 5, codigoSolicitud: "SOL-5", estado: "PENDIENTE" })
    pintar()
    expect(await screen.findByRole("heading", { name: "Fusible" })).toBeTruthy()
    expect(screen.getByText("FRN-R-20")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Agregar Fusible - Bussmann - FRN-R-20 al pedido" }))
    fireEvent.click(within(screen.getByRole("complementary")).getByRole("button", { name: /pedir cotización/i }))
    await waitFor(() => expect(api.pedirCotizacion).toHaveBeenCalled())
    expect(api.pedirCotizacion.mock.calls[0][0]).toEqual([expect.objectContaining({ descripcion: "Fusible - Bussmann - FRN-R-20", idProducto: 30 })])
  })

  it("marcas: se pueden buscar y ordenar por cantidad de repuestos o de la A a la Z", async () => {
    api.listar.mockResolvedValue([filtro, rodamiento, { ...rodamiento, idProducto: 7, nombre: "Otro rodamiento" }])
    pintar()
    const marcas = await screen.findByRole("group", { name: /filtrar por marca/i })
    const nombres = () => within(marcas).getAllByRole("button").map((b) => b.getAttribute("title")).filter(Boolean)
    expect(nombres()).toEqual(["SKF", "Caterpillar"])
    fireEvent.click(screen.getByRole("button", { name: /a–z/i }))
    expect(nombres()).toEqual(["Caterpillar", "SKF"])
    fireEvent.change(screen.getByLabelText(/buscar marca/i), { target: { value: "sk" } })
    expect(nombres()).toEqual(["SKF"])
    fireEvent.change(screen.getByLabelText(/buscar marca/i), { target: { value: "zzz" } })
    expect(screen.getByText(/ninguna marca coincide/i)).toBeTruthy()
  })

  it("con más de cinco categorías, las demás quedan en «Más» y se pueden elegir", async () => {
    const seis = Array.from({ length: 7 }, (_, i) => ({ ...filtro, idProducto: 400 + i, nombre: `Pieza C${i}`, idCategoria: 10 + i, categoria: `Categoría ${i}` }))
    api.listar.mockResolvedValue(seis)
    pintar()
    const grupo = await screen.findByRole("group", { name: /filtrar por categoría/i })
    expect(within(grupo).queryByRole("button", { name: /categoría 6/i })).toBeNull()
    fireEvent.click(within(grupo).getByRole("button", { name: /más/i }))
    fireEvent.click(within(grupo).getByRole("button", { name: /categoría 6/i }))
    expect(screen.getByText("Pieza C6")).toBeTruthy()
    expect(screen.queryByText("Pieza C0")).toBeNull()
  })
})

const MARCAS = ["Marca A", "Marca B", "Marca C", "Marca D", "Marca E", "Marca F", "Marca G", "Marca H", "Marca I", "Marca J"]

/** 55 repuestos: la marca i tiene (10 - i) repuestos de más. Los 30 primeros son «Filtros»; el resto, «Rodamientos». */
function catalogo(): RepuestoPortal[] {
  const lista: RepuestoPortal[] = []
  MARCAS.forEach((marca, m) => {
    for (let k = 0; k < 10 - m; k++) {
      const n = lista.length
      lista.push({
        ...filtro, idProducto: 100 + n, nombre: `Repuesto ${String(n + 1).padStart(2, "0")}`, marca, numeroParte: `NP-${n}`,
        idCategoria: n < 30 ? 3 : 5, categoria: n < 30 ? "Filtros" : "Rodamientos",
      })
    }
  })
  return lista
}

const grupoMarcas = () => screen.getByRole("group", { name: /filtrar por marca/i })
const listaRepuestos = () => screen.getByRole("list", { name: /lista de repuestos/i })
const paginacion = () => screen.getByRole("navigation", { name: /paginación de repuestos/i })
const paginaActual = () => within(paginacion()).getByRole("button", { current: "page" }).textContent

describe("RepuestosPage: catálogo ordenado y liviano", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    api.listar.mockResolvedValue(catalogo())
    portal.listarPedidos.mockResolvedValue([])
  })

  describe("filtro de marcas colapsado", () => {
    // v3.4 tarjetas de marca: se pliega tras 17 marcas (tres filas con «Todas las marcas»).
    const MARCAS_20 = Array.from({ length: 20 }, (_, i) => `Marca ${String.fromCharCode(65 + i)}`)
    /** La marca i tiene (20 - i) repuestos: A es la que más tiene y T la que menos. */
    const conVeinteMarcas = (): RepuestoPortal[] =>
      MARCAS_20.flatMap((marca, m) => Array.from({ length: 20 - m }, (_, k) => ({ ...filtro, idProducto: 1000 + m * 100 + k, nombre: `${marca} pieza ${k}`, marca })))
    beforeEach(() => api.listar.mockResolvedValue(conVeinteMarcas()))

    it("muestra solo las 17 marcas con más repuestos, de mayor a menor, y un botón «Ver todas las marcas (20)»", async () => {
      pintar()
      await screen.findByRole("list", { name: /lista de repuestos/i })
      const nombres = within(grupoMarcas()).getAllByRole("button").map((b) => b.getAttribute("aria-label"))
      expect(nombres).toEqual(["Todas las marcas", ...MARCAS_20.slice(0, 17)])
      expect(screen.getByRole("button", { name: "Ver todas las marcas (20)" }).getAttribute("aria-expanded")).toBe("false")
    })

    it("al expandir muestra las 20 marcas y el botón pasa a contraer", async () => {
      pintar()
      fireEvent.click(await screen.findByRole("button", { name: "Ver todas las marcas (20)" }))
      expect(within(grupoMarcas()).getByRole("button", { name: "Marca T" })).toBeTruthy()
      const contraer = screen.getByRole("button", { name: "Ver menos marcas" })
      expect(contraer.getAttribute("aria-expanded")).toBe("true")
      fireEvent.click(contraer)
      expect(within(grupoMarcas()).queryByRole("button", { name: "Marca T" })).toBeNull()
    })

    it("la marca elegida sigue a la vista aunque no esté entre las 17 primeras", async () => {
      pintar()
      fireEvent.click(await screen.findByRole("button", { name: "Ver todas las marcas (20)" }))
      fireEvent.click(within(grupoMarcas()).getByRole("button", { name: "Marca T" }))
      fireEvent.click(screen.getByRole("button", { name: "Ver menos marcas" }))
      expect(within(grupoMarcas()).getByRole("button", { name: "Marca T" }).getAttribute("aria-pressed")).toBe("true")
    })

    it("con 17 marcas o menos no hay botón", async () => {
      api.listar.mockResolvedValue([filtro, rodamiento])
      pintar()
      await screen.findByText("Filtro de combustible")
      expect(screen.queryByRole("button", { name: /ver todas las marcas/i })).toBeNull()
    })
  })

  describe("paginación de 12 en 12", () => {
    it("la primera página muestra 12 tarjetas y los controles", async () => {
      pintar()
      await screen.findByRole("list", { name: /lista de repuestos/i })
      expect(within(listaRepuestos()).getAllByRole("listitem")).toHaveLength(12)
      expect(screen.getByText("Repuesto 01")).toBeTruthy()
      expect(screen.queryByText("Repuesto 13")).toBeNull()
      expect(paginaActual()).toBe("1")
      expect((within(paginacion()).getByRole("button", { name: "Anterior" }) as HTMLButtonElement).disabled).toBe(true)
      expect(within(paginacion()).getByRole("button", { name: "Página 5" })).toBeTruthy()
    })

    it("Siguiente, Anterior y los números cambian de página", async () => {
      pintar()
      await screen.findByRole("list", { name: /lista de repuestos/i })
      fireEvent.click(within(paginacion()).getByRole("button", { name: "Siguiente" }))
      expect(paginaActual()).toBe("2")
      expect(screen.getByText("Repuesto 13")).toBeTruthy()
      expect(screen.queryByText("Repuesto 01")).toBeNull()
      fireEvent.click(within(paginacion()).getByRole("button", { name: "Anterior" }))
      expect(paginaActual()).toBe("1")
      fireEvent.click(within(paginacion()).getByRole("button", { name: "Página 5" }))
      expect(within(listaRepuestos()).getAllByRole("listitem")).toHaveLength(7) // 55 = 4 × 12 + 7
      expect((within(paginacion()).getByRole("button", { name: "Siguiente" }) as HTMLButtonElement).disabled).toBe(true)
    })

    it("al elegir una categoría vuelve a la página 1", async () => {
      pintar()
      await screen.findByRole("list", { name: /lista de repuestos/i })
      fireEvent.click(within(paginacion()).getByRole("button", { name: "Página 3" }))
      fireEvent.click(within(screen.getByRole("group", { name: /filtrar por categoría/i })).getByRole("button", { name: /filtros/i }))
      expect(paginaActual()).toBe("1")
      expect(screen.getByText("Repuesto 01")).toBeTruthy()
    })

    it("al elegir una marca vuelve a la página 1", async () => {
      api.listar.mockResolvedValue(catalogo().map((r) => (r.marca === "Marca A" || r.marca === "Marca B" ? { ...r, marca: "Marca A" } : r)))
      pintar()
      await screen.findByRole("list", { name: /lista de repuestos/i })
      fireEvent.click(within(paginacion()).getByRole("button", { name: "Página 2" }))
      fireEvent.click(within(grupoMarcas()).getByRole("button", { name: "Marca A" }))
      expect(paginaActual()).toBe("1")
      expect(screen.getByText("Repuesto 01")).toBeTruthy()
    })

    it("al buscar por texto vuelve a la página 1", async () => {
      pintar()
      await screen.findByRole("list", { name: /lista de repuestos/i })
      fireEvent.click(within(paginacion()).getByRole("button", { name: "Página 2" }))
      fireEvent.change(screen.getByLabelText(/buscar por nombre/i), { target: { value: "filtro" } })
      fireEvent.click(screen.getByRole("button", { name: "Buscar" }))
      await waitFor(() => expect(api.listar).toHaveBeenCalledWith("filtro"))
      expect(paginaActual()).toBe("1")
    })

    it("con 12 repuestos o menos no hay paginación", async () => {
      api.listar.mockResolvedValue(catalogo().slice(0, 12))
      pintar()
      await screen.findByRole("list", { name: /lista de repuestos/i })
      expect(screen.queryByRole("navigation", { name: /paginación de repuestos/i })).toBeNull()
    })
  })

  describe("«Lo que ya pediste» arriba del catálogo", () => {
    const pedidos = [
      ["2026-09-01", "Correa A"], ["2026-10-05", "Correa D"], ["2026-09-20", "Correa B"], ["2026-10-20", "Correa E"], ["2026-10-01", "Correa C"],
    ].map(([fecha, descripcion], i) => ({ id: i + 1, fecha, estado: "COTIZADA", items: [{ descripcion, cantidad: 1, unidad: "Unidad" }] }))

    it("va justo debajo de los filtros y antes de la grilla", async () => {
      portal.listarPedidos.mockResolvedValue(pedidos)
      pintar()
      await screen.findByRole("list", { name: /lista de repuestos/i })
      const seccion = screen.getByRole("region", { name: /lo que ya pediste/i })
      expect(grupoMarcas().compareDocumentPosition(seccion) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(seccion.compareDocumentPosition(listaRepuestos()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it("muestra los 3 últimos pedidos y «Ver todos (5)» para expandir y contraer", async () => {
      portal.listarPedidos.mockResolvedValue(pedidos)
      pintar()
      const seccion = await screen.findByRole("region", { name: /lo que ya pediste/i })
      await within(seccion).findByText(/correa e/i)
      expect(within(seccion).getAllByRole("listitem").map((li) => li.textContent?.slice(0, 8))).toEqual(["Correa E", "Correa D", "Correa C"])

      const ver = within(seccion).getByRole("button", { name: "Ver todos (5)" })
      expect(ver.getAttribute("aria-expanded")).toBe("false")
      fireEvent.click(ver)
      expect(within(seccion).getAllByRole("listitem")).toHaveLength(5)
      fireEvent.click(within(seccion).getByRole("button", { name: "Ver menos" }))
      expect(within(seccion).getAllByRole("listitem")).toHaveLength(3)
    })

    it("con 3 ítems o menos no ofrece «Ver todos»", async () => {
      portal.listarPedidos.mockResolvedValue(pedidos.slice(0, 2))
      pintar()
      const seccion = await screen.findByRole("region", { name: /lo que ya pediste/i })
      expect(within(seccion).queryByRole("button", { name: /ver todos/i })).toBeNull()
    })

    it("sin historial no aparece", async () => {
      pintar()
      await screen.findByRole("list", { name: /lista de repuestos/i })
      expect(screen.queryByRole("region", { name: /lo que ya pediste/i })).toBeNull()
    })
  })

  describe("tarjetas y panel del pedido", () => {
    it("el panel «Tu pedido de cotización» acompaña al desplazarse (sticky bajo la barra) y no se estira", async () => {
      pintar()
      await screen.findByRole("list", { name: /lista de repuestos/i })
      const panel = screen.getByRole("complementary")
      expect(panel.className).toContain("lg:sticky")
      expect(panel.className).toContain("lg:top-24")
      expect(panel.className).toContain("lg:self-start")
    })

    it("sin foto el recuadro es bajo (h-24); con foto conserva su altura", async () => {
      api.listar.mockResolvedValue([{ ...filtro, urlImagen: null }, { ...rodamiento, urlImagen: "https://res.cloudinary.com/x/6205.jpg" }])
      pintar()
      await screen.findByText("Filtro de combustible")
      const [sinFoto, conFoto] = within(listaRepuestos()).getAllByRole("listitem")
      expect(sinFoto.firstElementChild?.className).toContain("h-24")
      expect(sinFoto.firstElementChild?.className).not.toContain("h-32")
      expect(conFoto.firstElementChild?.className).toContain("h-32")
    })

    it("sin precio dice «Precio a consultar» (sin «referencial»); con precio lo marca referencial", async () => {
      api.listar.mockResolvedValue([{ ...filtro, precioReferencial: null }, rodamiento])
      pintar()
      await screen.findByText("Filtro de combustible")
      const [sinPrecio, conPrecio] = within(listaRepuestos()).getAllByRole("listitem")
      expect(within(sinPrecio).getByText("Precio a consultar")).toBeTruthy()
      expect(within(sinPrecio).queryByText(/referencial/i)).toBeNull()
      expect(within(conPrecio).getByText(/referencial/i)).toBeTruthy()
    })
  })
})
