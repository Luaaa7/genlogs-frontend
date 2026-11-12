import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import axios from "axios"
import type { MetaPeriodo } from "@/api/metasApi"

const http = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock("@/api/axiosClient", () => ({ axiosClient: http }))

import { MetaPlazoCard } from "./MetaPlazoCard"

function meta(over: Partial<MetaPeriodo> = {}): MetaPeriodo {
  return {
    anio: 2026,
    mes: 11,
    metaPorcentaje: 90,
    cotizacionesEnPlazo: 9,
    cotizacionesConsideradas: 10,
    porcentaje: 90,
    cumple: true,
    ...over,
  }
}

function pintar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <MetaPlazoCard />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("MetaPlazoCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("con porcentaje 90 y meta 90 se ve que cumple", async () => {
    http.get.mockResolvedValue({ data: meta() })
    pintar()
    expect(await screen.findByText(/El mes va dentro de la meta/)).toBeTruthy()
    expect(screen.getByText("Meta 90%")).toBeTruthy()
    expect(screen.getByText("90%")).toBeTruthy()
    expect(screen.getByText("9 de 10 cotizaciones en el plazo")).toBeTruthy()
    expect(screen.getByText(/noviembre de 2026/i)).toBeTruthy()
  })

  it("con porcentaje 80 se ve que no cumple", async () => {
    http.get.mockResolvedValue({ data: meta({ porcentaje: 80, cumple: false, cotizacionesEnPlazo: 8 }) })
    pintar()
    expect(await screen.findByText(/Quedó por debajo de la meta/)).toBeTruthy()
    expect(screen.getByText(/El Jefe registra la acción/)).toBeTruthy()
    expect(screen.getByText("80%")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Ver las acciones del mes" }).getAttribute("href")).toBe("/acciones?anio=2026&mes=11")
    expect(screen.queryByText(/dentro de la meta/)).toBeNull()
  })

  it("con porcentaje null muestra el guion y no el aviso de incumplimiento", async () => {
    http.get.mockResolvedValue({
      data: meta({ porcentaje: null, cumple: null, cotizacionesEnPlazo: 0, cotizacionesConsideradas: 0 }),
    })
    pintar()
    expect(await screen.findByText("—")).toBeTruthy()
    expect(screen.getByText("0 de 0 cotizaciones en el plazo")).toBeTruthy()
    expect(screen.queryByText(/por debajo/)).toBeNull()
    expect(screen.queryByText(/dentro de la meta/)).toBeNull()
  })

  it("un error de la lectura no rompe el componente", async () => {
    http.get.mockRejectedValue(new axios.AxiosError("falló", "ERR_BAD_RESPONSE", undefined, undefined, {
      status: 500,
      data: {},
      headers: {},
      config: { headers: {} } as never,
      statusText: "error",
    }))
    pintar()
    expect(await screen.findByRole("alert")).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Cotizaciones en el plazo" })).toBeTruthy()
    expect(screen.queryByText(/por debajo/)).toBeNull()
  })
})
