import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { portalCotizacionesApi, type CotizacionPortal } from "@/api/portalCotizacionesApi"
import { MisCotizacionesPage } from "./MisCotizacionesPage"
import { CotizacionPortalDetallePage } from "./CotizacionPortalDetallePage"

function renderEn(ruta: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/portal/cotizaciones" element={<MisCotizacionesPage />} />
          <Route path="/portal/cotizaciones/:id" element={<CotizacionPortalDetallePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const vigente = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10)

const enviada: CotizacionPortal = {
  id: 7, codigo: "COT-2026-7", fechaCotizacion: "2026-11-10", fechaValidez: vigente, estado: "Enviada",
  total: 1250.5, moneda: "USD",
  lineas: [{ descripcion: "Filtro de aceite 1R-0750", cantidad: 2, unidad: "UND", precioUnitario: 625.25, importe: 1250.5 }],
}
const aprobada: CotizacionPortal = { ...enviada, id: 8, codigo: "COT-2026-8", estado: "Aprobada", numeroOcCliente: "OC-4500123" }

describe("Mis cotizaciones (portal)", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("lista las cotizaciones con estado, total y N.º de OC si ya tiene", async () => {
    vi.spyOn(portalCotizacionesApi, "listar").mockResolvedValue([enviada, aprobada])
    renderEn("/portal/cotizaciones")

    expect(await screen.findByText("COT-2026-7")).toBeTruthy()
    expect(screen.getByText("Enviada")).toBeTruthy()
    expect(screen.getByText("Aprobada")).toBeTruthy()
    expect(screen.getByText(/OC-4500123/)).toBeTruthy()
    expect(screen.getAllByText(/1,250\.50|1 250,50|1\.250,50/).length).toBeGreaterThan(0)
  })

  it("sin cotizaciones muestra un mensaje claro", async () => {
    vi.spyOn(portalCotizacionesApi, "listar").mockResolvedValue([])
    renderEn("/portal/cotizaciones")
    expect(await screen.findByText(/todavía no tienes cotizaciones/i)).toBeTruthy()
  })
})

describe("Detalle de cotización: revisar y aprobar en 2 clics", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("muestra las líneas y aprueba con Aprobar → Confirmar", async () => {
    vi.spyOn(portalCotizacionesApi, "detalle").mockResolvedValue(enviada)
    const aprobar = vi.spyOn(portalCotizacionesApi, "aprobar").mockResolvedValue({ ...enviada, estado: "Aprobada" })
    renderEn("/portal/cotizaciones/7")

    expect(await screen.findByText("Filtro de aceite 1R-0750")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Aprobar cotización" }))
    fireEvent.click(await screen.findByRole("button", { name: "Sí, aprobar" }))

    await waitFor(() => expect(aprobar).toHaveBeenCalledWith(7, undefined))
  })

  it("rechaza enviando el motivo que escribió el cliente", async () => {
    vi.spyOn(portalCotizacionesApi, "detalle").mockResolvedValue(enviada)
    const rechazar = vi.spyOn(portalCotizacionesApi, "rechazar").mockResolvedValue({ ...enviada, estado: "Rechazada" })
    renderEn("/portal/cotizaciones/7")
    await screen.findByText("Filtro de aceite 1R-0750")

    fireEvent.change(screen.getByLabelText(/comentario/i), { target: { value: "  Precio alto  " } })
    fireEvent.click(screen.getByRole("button", { name: "Rechazar" }))
    fireEvent.click(await screen.findByRole("button", { name: "Sí, rechazar" }))

    await waitFor(() => expect(rechazar).toHaveBeenCalledWith(7, "Precio alto"))
  })

  it("si ya está aprobada no muestra los botones y sí el N.º de OC", async () => {
    vi.spyOn(portalCotizacionesApi, "detalle").mockResolvedValue(aprobada)
    renderEn("/portal/cotizaciones/8")

    expect(await screen.findByText(/OC-4500123/)).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Aprobar cotización" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Rechazar" })).toBeNull()
  })

  it("si el backend rechaza la decisión, muestra su mensaje", async () => {
    vi.spyOn(portalCotizacionesApi, "detalle").mockResolvedValue(enviada)
    vi.spyOn(portalCotizacionesApi, "aprobar").mockRejectedValue({
      isAxiosError: true, response: { status: 400, data: { message: "La cotización está vencida" } },
    })
    renderEn("/portal/cotizaciones/7")
    await screen.findByText("Filtro de aceite 1R-0750")

    fireEvent.click(screen.getByRole("button", { name: "Aprobar cotización" }))
    fireEvent.click(await screen.findByRole("button", { name: "Sí, aprobar" }))

    expect(await screen.findByText("La cotización está vencida")).toBeTruthy()
  })
})
