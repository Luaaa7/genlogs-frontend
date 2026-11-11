import { fireEvent, render, screen } from "@testing-library/react"
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
})
