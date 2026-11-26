import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactElement } from "react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import { portalApi } from "@/api/portalApi"
import { portalComprobantesApi } from "@/api/portalComprobantesApi"
import { portalCotizacionesApi } from "@/api/portalCotizacionesApi"
import { despachosApi } from "@/features/despacho/api/despachosApi"
import { repuestosApi } from "../repuestos/repuestosApi"
import { RepuestosPage } from "../repuestos/RepuestosPage"
import { MisComprobantesPage } from "./MisComprobantesPage"
import { MisCotizacionesPage } from "./MisCotizacionesPage"
import { MisDespachosPage } from "./MisDespachosPage"
import { MisPedidosPage } from "./MisPedidosPage"

const nunca = () => new Promise<never>(() => {})

function pintar(pagina: ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><Routes><Route path="*" element={pagina} /></Routes></MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("Estados de carga del portal: esqueletos en lugar de «Cargando...»", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it.each([
    ["Mis pedidos", "Cargando pedidos...", () => vi.spyOn(portalApi, "listarPedidos").mockImplementation(nunca), <MisPedidosPage />],
    ["Mis cotizaciones", "Cargando cotizaciones...", () => vi.spyOn(portalCotizacionesApi, "listar").mockImplementation(nunca), <MisCotizacionesPage />],
    ["Mis comprobantes", "Cargando comprobantes...", () => vi.spyOn(portalComprobantesApi, "listar").mockImplementation(nunca), <MisComprobantesPage />],
    ["Mis despachos", "Cargando despachos...", () => vi.spyOn(despachosApi, "listarPortal").mockImplementation(nunca), <MisDespachosPage />],
  ])("%s muestra 3 tarjetas fantasma mientras carga, con su encabezado ya visible", (titulo, etiqueta, simular, pagina) => {
    simular()
    pintar(pagina)
    expect(screen.getAllByTestId("skeleton-card")).toHaveLength(3)
    expect(screen.getByRole("status").textContent).toContain(etiqueta)
    expect(screen.getByRole("heading", { level: 1, name: titulo })).toBeTruthy()
  })

  it("Repuestos muestra 3 tarjetas fantasma en la grilla mientras carga", () => {
    vi.spyOn(repuestosApi, "listar").mockImplementation(nunca)
    vi.spyOn(portalApi, "listarPedidos").mockResolvedValue([])
    pintar(<RepuestosPage />)
    const tarjetas = screen.getAllByTestId("skeleton-card")
    expect(tarjetas).toHaveLength(3)
    expect(tarjetas[0].closest('[role="status"]')?.textContent).toContain("Cargando repuestos...")
  })

  it("al llegar los datos, los esqueletos desaparecen", async () => {
    vi.spyOn(portalCotizacionesApi, "listar").mockResolvedValue([])
    pintar(<MisCotizacionesPage />)
    await waitFor(() => expect(screen.queryAllByTestId("skeleton-card")).toHaveLength(0))
    expect(screen.getByText(/todavía no tienes cotizaciones/i)).toBeTruthy()
  })

  it("si falla la carga, no queda el esqueleto: se ve el aviso para reintentar", async () => {
    vi.spyOn(portalCotizacionesApi, "listar").mockRejectedValue(new Error("500"))
    pintar(<MisCotizacionesPage />)
    expect(await screen.findByText(/no pudimos cargar tus cotizaciones/i)).toBeTruthy()
    expect(screen.queryAllByTestId("skeleton-card")).toHaveLength(0)
  })

  it("Buscar en Repuestos muestra «Buscando...» con spinner y se deshabilita mientras llega la respuesta", async () => {
    const listar = vi.spyOn(repuestosApi, "listar").mockResolvedValueOnce([])
    vi.spyOn(portalApi, "listarPedidos").mockResolvedValue([])
    pintar(<RepuestosPage />)
    await screen.findByText(/no encontramos ese repuesto/i)

    listar.mockImplementation(nunca)
    fireEvent.change(screen.getByLabelText("Buscar por nombre o N.º de parte"), { target: { value: "filtro" } })
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }))

    const boton = await screen.findByRole("button", { name: "Buscando..." })
    expect(boton.hasAttribute("disabled")).toBe(true)
    expect(boton.firstElementChild?.getAttribute("class")).toContain("animate-spin")
  })
})
