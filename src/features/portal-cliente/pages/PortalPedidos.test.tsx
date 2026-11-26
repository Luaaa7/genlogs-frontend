import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { portalApi } from "@/api/portalApi"
import type { Pedido } from "@/types/portal.types"
import { MisPedidosPage } from "./MisPedidosPage"
import { PedidoDetallePage } from "./PedidoDetallePage"

function renderEn(ruta: string | { pathname: string; state?: unknown }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/portal/pedidos" element={<MisPedidosPage />} />
          <Route path="/portal/pedidos/:id" element={<PedidoDetallePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const pedidos = [
  { id: 1, codigo: "SOL-2026-1", fecha: "2026-11-10T10:00:00", estado: "PENDIENTE", asunto: "Filtros" },
  { id: 2, codigo: "SOL-2026-2", fecha: "2026-11-10T11:00:00", estado: "EN_REVISION", asunto: "Rodamientos" },
  { id: 3, codigo: "SOL-2026-3", fecha: "2026-11-10T12:00:00", estado: "COTIZADA", asunto: "Mangueras" },
]

describe("Mis pedidos con los estados reales del backend", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("muestra cada pedido con el nombre que ve el cliente", async () => {
    vi.spyOn(portalApi, "listarPedidos").mockResolvedValue(pedidos)
    renderEn("/portal/pedidos")

    expect(await screen.findByText("Filtros")).toBeTruthy()
    expect(screen.getAllByText("Recibida").length).toBeGreaterThan(0)
    expect(screen.getAllByText("En búsqueda").length).toBeGreaterThan(0)
  })

  it("filtrar por 'En búsqueda' deja solo los pedidos en EN_REVISION", async () => {
    vi.spyOn(portalApi, "listarPedidos").mockResolvedValue(pedidos)
    renderEn("/portal/pedidos")
    await screen.findByText("Filtros")

    fireEvent.click(screen.getByRole("button", { name: /^En búsqueda/ }))

    expect(screen.getByText("Rodamientos")).toBeTruthy()
    expect(screen.queryByText("Filtros")).toBeNull()
    expect(screen.queryByText("Mangueras")).toBeNull()
  })
})

describe("Pedido recién creado (location.state.nuevoPedidoId)", () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.useRealTimers())

  it("resalta la fila del pedido nuevo con la insignia «Recién creada» y no las demás", async () => {
    vi.spyOn(portalApi, "listarPedidos").mockResolvedValue(pedidos)
    renderEn({ pathname: "/portal/pedidos", state: { nuevoPedidoId: 2 } })

    await screen.findByText("Rodamientos")

    expect(screen.getAllByText("Recién creada")).toHaveLength(1)
    const fila = screen.getByText("Rodamientos").closest("article") as HTMLElement
    expect(within(fila).getByText("Recién creada")).toBeTruthy()
  })

  it("sin location.state no hay ninguna insignia", async () => {
    vi.spyOn(portalApi, "listarPedidos").mockResolvedValue(pedidos)
    renderEn("/portal/pedidos")
    await screen.findByText("Rodamientos")
    expect(screen.queryByText("Recién creada")).toBeNull()
  })

  it("el resaltado dura unos segundos y luego desaparece", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.spyOn(portalApi, "listarPedidos").mockResolvedValue(pedidos)
    renderEn({ pathname: "/portal/pedidos", state: { nuevoPedidoId: 2 } })
    await screen.findByText("Recién creada")

    act(() => {
      vi.advanceTimersByTime(8000)
    })

    expect(screen.queryByText("Recién creada")).toBeNull()
  })
})

const articulo = (titulo: string) => screen.getByText(titulo).closest("article") as HTMLElement

describe("Mis pedidos con el estilo de la landing", () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.useRealTimers())
  const conPedidos = (lista: Pedido[] = pedidos) => vi.spyOn(portalApi, "listarPedidos").mockResolvedValue(lista)

  it("tiene el encabezado con la etiqueta dorada, el título y el botón píldora amarillo", async () => {
    conPedidos()
    renderEn("/portal/pedidos")
    await screen.findByText("Filtros")

    expect(screen.getByText("Portal del cliente")).toBeTruthy()
    expect(screen.getByRole("heading", { level: 1, name: "Mis pedidos" })).toBeTruthy()
    const boton = screen.getByRole("link", { name: "Nueva solicitud" })
    expect(boton.getAttribute("href")).toBe("/portal/solicitud")
    expect(boton.className).toContain("rounded-full")
    expect(boton.className).toContain("bg-[#FACC15]")
  })

  it("las pastillas de filtro llevan contadores, también en cero", async () => {
    conPedidos()
    renderEn("/portal/pedidos")
    await screen.findByText("Filtros")

    for (const nombre of ["Todos (3)", "Recibida (1)", "En búsqueda (1)", "En espera de proveedor (0)", "Cotizada (1)", "No se pudo cotizar (0)", "Cancelada (0)"]) {
      expect(screen.getByRole("button", { name: nombre })).toBeTruthy()
    }
  })

  it("al filtrar, los contadores siguen mostrando el total de cada estado", async () => {
    conPedidos()
    renderEn("/portal/pedidos")
    await screen.findByText("Filtros")

    fireEvent.click(screen.getByRole("button", { name: "Cotizada (1)" }))

    expect(screen.getByRole("button", { name: "Todos (3)" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Recibida (1)" })).toBeTruthy()
  })

  it("cada tarjeta lleva un borde izquierdo según su estado", async () => {
    conPedidos()
    renderEn("/portal/pedidos")
    await screen.findByText("Filtros")

    expect(articulo("Filtros").className).toContain("border-l-4")
    expect(articulo("Filtros").className).toContain("border-l-slate-400")
    expect(articulo("Rodamientos").className).toContain("border-l-info")
    expect(articulo("Mangueras").className).toContain("border-l-success")
  })

  it("no repite el título como subtítulo, pero sí muestra una descripción distinta", async () => {
    conPedidos([
      { id: 1, codigo: "SOL-1", fecha: "2026-11-10T10:00:00", estado: "PENDIENTE", asunto: "Filtros", descripcion: "Filtros" },
      { id: 2, codigo: "SOL-2", fecha: "2026-11-10T11:00:00", estado: "PENDIENTE", asunto: "Rodamientos", descripcion: "Para el cargador frontal" },
    ])
    renderEn("/portal/pedidos")
    await screen.findByText("Rodamientos")

    expect(screen.getAllByText("Filtros")).toHaveLength(1)
    expect(screen.getByText("Para el cargador frontal")).toBeTruthy()
    expect(screen.queryByText("Ver detalle del pedido")).toBeNull()
  })

  it("cada tarjeta muestra la barra de 4 etapas con la etapa actual", async () => {
    conPedidos()
    renderEn("/portal/pedidos")
    await screen.findByText("Filtros")

    const etapas = within(articulo("Rodamientos")).getAllByRole("listitem")
    expect(etapas.map((e) => e.textContent?.replace(/\(.*\)/, ""))).toEqual(["Recibida", "En búsqueda", "En espera de proveedor", "Cotizada"])
    expect(etapas[1].getAttribute("aria-current")).toBe("step")
    expect(within(articulo("Rodamientos")).queryByText(/despacho/i)).toBeNull()
  })

  it("solo las solicitudes Cotizadas ofrecen «Ver cotizaciones», que lleva a Mis cotizaciones", async () => {
    conPedidos()
    renderEn("/portal/pedidos")
    await screen.findByText("Filtros")

    const enlace = within(articulo("Mangueras")).getByRole("link", { name: "Ver cotizaciones" })
    expect(enlace.getAttribute("href")).toBe("/portal/cotizaciones")
    expect(within(articulo("Filtros")).queryByRole("link", { name: "Ver cotizaciones" })).toBeNull()
    expect(within(articulo("Rodamientos")).queryByRole("link", { name: "Ver cotizaciones" })).toBeNull()
  })

  describe("vista rápida", () => {
    const detalle = { ...pedidos[2], items: [{ descripcion: "Manguera hidráulica 1/2", cantidad: 4, unidad: "MTR" }, { descripcion: "Abrazadera", cantidad: 8 }] }
    const abrir = async (titulo = "Mangueras") => {
      vi.spyOn(portalApi, "obtenerPedido").mockResolvedValue(detalle)
      conPedidos()
      renderEn("/portal/pedidos")
      await screen.findByText(titulo)
      fireEvent.click(within(articulo(titulo)).getByRole("button", { name: `Vista rápida de ${titulo}` }))
      return screen.findByRole("dialog", { name: "Mangueras" })
    }

    it("abre un panel con los ítems de la solicitud y el estado de su cotización", async () => {
      const dialogo = await abrir()

      expect(await within(dialogo).findByText("Manguera hidráulica 1/2")).toBeTruthy()
      expect(within(dialogo).getByText(/4 MTR/)).toBeTruthy()
      expect(within(dialogo).getByText("Abrazadera")).toBeTruthy()
      expect(within(dialogo).getByText(/tu cotización está lista/i)).toBeTruthy()
      expect(within(dialogo).getByRole("link", { name: "Ver cotizaciones" }).getAttribute("href")).toBe("/portal/cotizaciones")
      expect(within(dialogo).getByRole("link", { name: "Ver detalle completo" }).getAttribute("href")).toBe("/portal/pedidos/3")
    })

    it("en una solicitud sin cotizar avisa que todavía no hay cotización", async () => {
      vi.spyOn(portalApi, "obtenerPedido").mockResolvedValue({ ...pedidos[0], items: [] })
      conPedidos()
      renderEn("/portal/pedidos")
      await screen.findByText("Filtros")
      fireEvent.click(within(articulo("Filtros")).getByRole("button", { name: "Vista rápida de Filtros" }))

      const dialogo = await screen.findByRole("dialog", { name: "Filtros" })
      expect(within(dialogo).getByText(/todavía no hay cotización/i)).toBeTruthy()
      expect(within(dialogo).queryByRole("link", { name: "Ver cotizaciones" })).toBeNull()
    })

    it("se cierra con el botón o con Escape, y el foco vuelve al botón de la tarjeta", async () => {
      await abrir()
      fireEvent.click(screen.getByRole("button", { name: "Cerrar vista rápida" }))
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
      expect(document.activeElement).toBe(within(articulo("Mangueras")).getByRole("button", { name: "Vista rápida de Mangueras" }))

      fireEvent.click(within(articulo("Mangueras")).getByRole("button", { name: "Vista rápida de Mangueras" }))
      await screen.findByRole("dialog")
      fireEvent.keyDown(document, { key: "Escape" })
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    })

    it("se abre y se cierra con transición: fondo difuminado, panel que se desliza y espera a terminar antes de salir", async () => {
      const dialogo = await abrir()
      const fondo = dialogo.parentElement as HTMLElement
      expect(fondo.className).toContain("backdrop-blur-xs")
      expect(fondo.className).toContain("transition-opacity")
      expect(fondo.className).toContain("motion-reduce:transition-none")
      expect(dialogo.className).toContain("transition-transform")
      expect(dialogo.className).toContain("motion-reduce:transition-none")

      // Entra: primero fuera de pantalla y enseguida en su lugar.
      await waitFor(() => expect(dialogo.className).toContain("translate-x-0"))
      expect(fondo.className).toContain("opacity-100")

      // Sale: se desliza y se desvanece, y solo después se desmonta.
      fireEvent.click(screen.getByRole("button", { name: "Cerrar vista rápida" }))
      expect(screen.getByRole("dialog")).toBeTruthy()
      expect(dialogo.className).toContain("translate-x-full")
      expect(fondo.className).toContain("opacity-0")
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    })

    it("no pierde el filtro que estaba activo", async () => {
      vi.spyOn(portalApi, "obtenerPedido").mockResolvedValue(detalle)
      conPedidos()
      renderEn("/portal/pedidos")
      await screen.findByText("Filtros")
      fireEvent.click(screen.getByRole("button", { name: "Cotizada (1)" }))
      fireEvent.click(within(articulo("Mangueras")).getByRole("button", { name: "Vista rápida de Mangueras" }))
      await screen.findByRole("dialog")

      fireEvent.click(screen.getByRole("button", { name: "Cerrar vista rápida" }))
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())

      expect(screen.queryByText("Filtros")).toBeNull()
      expect(screen.getByText("Mangueras")).toBeTruthy()
    })
  })
})

describe("Detalle del pedido", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("muestra la barra de estados en la etapa del pedido", async () => {
    vi.spyOn(portalApi, "obtenerPedido").mockResolvedValue({ ...pedidos[1] })
    renderEn("/portal/pedidos/2")

    const barra = await screen.findByRole("list", { name: "Avance del pedido" })
    expect(barra.querySelector('[aria-current="step"]')?.textContent).toMatch(/En búsqueda/)
  })

  it("D-28: muestra 'Cancelar pedido' mientras está En búsqueda y cancela tras confirmar", async () => {
    vi.spyOn(portalApi, "obtenerPedido").mockResolvedValue({ ...pedidos[1] })
    const cancelar = vi.spyOn(portalApi, "cancelarPedido").mockResolvedValue(undefined)
    renderEn("/portal/pedidos/2")

    fireEvent.click(await screen.findByRole("button", { name: "Cancelar pedido" }))
    fireEvent.change(screen.getByLabelText("Motivo (opcional)"), { target: { value: "Ya lo conseguimos" } })
    fireEvent.click(screen.getByRole("button", { name: "Sí, cancelar" }))

    await waitFor(() => expect(cancelar).toHaveBeenCalledWith("2", "Ya lo conseguimos"))
  })

  it("D-28: si se arrepiente, no cancela", async () => {
    vi.spyOn(portalApi, "obtenerPedido").mockResolvedValue({ ...pedidos[1] })
    const cancelar = vi.spyOn(portalApi, "cancelarPedido")
    renderEn("/portal/pedidos/2")

    fireEvent.click(await screen.findByRole("button", { name: "Cancelar pedido" }))
    fireEvent.click(screen.getByRole("button", { name: "No, mantener" }))

    expect(cancelar).not.toHaveBeenCalled()
    expect(screen.queryByRole("button", { name: "Sí, cancelar" })).toBeNull()
  })

  it("D-28: ya cotizado no muestra el botón de cancelar", async () => {
    vi.spyOn(portalApi, "obtenerPedido").mockResolvedValue({ ...pedidos[2] })
    renderEn("/portal/pedidos/3")

    await screen.findByRole("list", { name: "Avance del pedido" })
    expect(screen.queryByRole("button", { name: "Cancelar pedido" })).toBeNull()
  })

  it("D-28: si el backend rechaza la cancelación muestra el error", async () => {
    vi.spyOn(portalApi, "obtenerPedido").mockResolvedValue({ ...pedidos[0] })
    vi.spyOn(portalApi, "cancelarPedido").mockRejectedValue(new Error("409"))
    renderEn("/portal/pedidos/1")

    fireEvent.click(await screen.findByRole("button", { name: "Cancelar pedido" }))
    fireEvent.click(screen.getByRole("button", { name: "Sí, cancelar" }))

    expect(await screen.findByText(/no se pudo cancelar/i)).toBeTruthy()
  })
})

describe("Detalle del pedido: su cotización", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("cuando la cotización ya se le envió, ofrece abrirla", async () => {
    vi.spyOn(portalApi, "obtenerPedido").mockResolvedValue({ ...pedidos[2], idCotizacion: 50 })
    renderEn("/portal/pedidos/3")

    const enlace = await screen.findByRole("link", { name: "Ver mi cotización" })
    expect(enlace.getAttribute("href")).toBe("/portal/cotizaciones/50")
  })

  it("cotizado pero aún sin enviar, avisa que la está preparando y no ofrece enlace", async () => {
    vi.spyOn(portalApi, "obtenerPedido").mockResolvedValue({ ...pedidos[2] })
    renderEn("/portal/pedidos/3")

    expect(await screen.findByText(/estamos preparando tu cotización/i)).toBeTruthy()
    expect(screen.queryByRole("link", { name: "Ver mi cotización" })).toBeNull()
  })

  it("mientras lo buscamos no muestra nada de cotización", async () => {
    vi.spyOn(portalApi, "obtenerPedido").mockResolvedValue({ ...pedidos[1] })
    renderEn("/portal/pedidos/2")

    await screen.findByRole("list", { name: "Avance del pedido" })
    expect(screen.queryByText(/estamos preparando tu cotización/i)).toBeNull()
    expect(screen.queryByRole("link", { name: "Ver mi cotización" })).toBeNull()
  })
})
