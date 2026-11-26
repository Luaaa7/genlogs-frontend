import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { portalApi } from "@/api/portalApi"
import { portalCotizacionesApi } from "@/api/portalCotizacionesApi"
import { portalReclamosApi } from "@/api/portalReclamosApi"
import { despachosApi } from "@/features/despacho/api/despachosApi"
import { MisPedidosPage } from "./MisPedidosPage"
import { MisCotizacionesPage } from "./MisCotizacionesPage"
import { MisDespachosPage } from "./MisDespachosPage"
import { MisReclamosPage } from "./MisReclamosPage"

function renderPagina(pagina: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{pagina}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("Encabezado de las vistas del portal: botón «Nueva solicitud» amarillo", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(portalApi, "listarPedidos").mockResolvedValue([])
    vi.spyOn(portalCotizacionesApi, "listar").mockResolvedValue([])
    vi.spyOn(portalReclamosApi, "listar").mockResolvedValue([])
    vi.spyOn(despachosApi, "listarPortal").mockResolvedValue([])
  })

  it.each([
    ["Mis pedidos", <MisPedidosPage />],
    ["Mis cotizaciones", <MisCotizacionesPage />],
    ["Mis despachos", <MisDespachosPage />],
    ["Reclamos", <MisReclamosPage />],
  ])("%s muestra el botón a /portal/solicitud en amarillo", async (_nombre, pagina) => {
    renderPagina(pagina)
    const enlace = await screen.findByRole("link", { name: "Nueva solicitud" })
    expect(enlace.getAttribute("href")).toBe("/portal/solicitud")
    expect(enlace.className).toContain("bg-[#FACC15]")
  })
})
