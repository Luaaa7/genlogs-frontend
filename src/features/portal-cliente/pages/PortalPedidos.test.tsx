import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { portalApi } from "@/api/portalApi"
import { MisPedidosPage } from "./MisPedidosPage"
import { PedidoDetallePage } from "./PedidoDetallePage"

function renderEn(ruta: string) {
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

    fireEvent.click(screen.getByRole("button", { name: "En búsqueda" }))

    expect(screen.getByText("Rodamientos")).toBeTruthy()
    expect(screen.queryByText("Filtros")).toBeNull()
    expect(screen.queryByText("Mangueras")).toBeNull()
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
