import { beforeEach, describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import type { AvisosResponse, NotificacionResponse } from "@/api/contratos/notificaciones"

const http = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }))
vi.mock("@/api/axiosClient", () => ({ axiosClient: http }))

import { CampanaAvisos } from "./CampanaAvisos"

function aviso(over: Partial<NotificacionResponse>): NotificacionResponse {
  return {
    idNotificacion: 1,
    tipo: "DOCUMENTO_POR_VENCER",
    titulo: "",
    mensaje: null,
    enlace: "/ordenes-compra",
    leida: false,
    fechaCreacion: "2026-11-12T08:30:00",
    ...over,
  }
}

const PASE = aviso({
  idNotificacion: 1,
  titulo: "PASE del despacho #3 vence el 19/11/2026 (aviso de 7 días)",
  mensaje: "Faltan 7 días para que venza el PASE del despacho #3. Renuévalo antes de que bloquee el despacho.",
})

const SCTR = aviso({
  idNotificacion: 2,
  titulo: "SCTR del despacho #8 vence el 27/11/2026 (aviso de 15 días)",
  mensaje: "Faltan 15 días para que venza el SCTR del despacho #8. Renuévalo antes de que bloquee el despacho.",
})

const OTRO = aviso({
  idNotificacion: 3,
  tipo: "ALTO_VALOR",
  titulo: "Cotización de alto valor",
  mensaje: "COT-2026-15 por S/ 25 000",
  enlace: "/cotizaciones/15",
})

const LEIDO = aviso({ idNotificacion: 4, titulo: "Aviso ya leído", leida: true, enlace: null })

function pintar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <header>
          <CampanaAvisos />
          <button type="button">Buscar</button>
        </header>
        <Routes>
          <Route path="/dashboard" element={<p>Dashboard</p>} />
          <Route path="/cotizaciones/:id" element={<p>Detalle de la cotización</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function lista(avisos: NotificacionResponse[]): AvisosResponse {
  return { noLeidas: avisos.filter((a) => !a.leida).length, avisos }
}

const campana = () => screen.getByRole("button", { name: /^Avisos/ })

describe("campana de avisos", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    http.patch.mockResolvedValue({ status: 204 })
  })

  it("muestra el pase a 7 días, el SCTR a 15 y cualquier otro tipo tal cual vienen", async () => {
    http.get.mockResolvedValue({ data: lista([PASE, SCTR, OTRO]) })
    pintar()
    fireEvent.click(campana())
    expect(await screen.findByText(PASE.titulo)).toBeTruthy()
    expect(screen.getByText(PASE.mensaje as string)).toBeTruthy()
    expect(screen.getByText(SCTR.titulo)).toBeTruthy()
    expect(screen.getByText(SCTR.mensaje as string)).toBeTruthy()
    expect(screen.getByText(OTRO.titulo)).toBeTruthy()
    expect(screen.getByText(OTRO.mensaje as string)).toBeTruthy()
    expect(http.get).toHaveBeenCalledWith("/notificaciones")
  })

  it("la lista vacía no rompe el encabezado", async () => {
    http.get.mockResolvedValue({ data: lista([]) })
    pintar()
    fireEvent.click(campana())
    expect(await screen.findByText("No hay avisos.")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Buscar" })).toBeTruthy()
  })

  it("si el GET falla, el resto del encabezado sigue", async () => {
    http.get.mockRejectedValue(new Error("sin avisos"))
    pintar()
    fireEvent.click(campana())
    expect(await screen.findByRole("alert")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Buscar" })).toBeTruthy()
    expect(campana()).toBeTruthy()
  })

  // ---- FE-A (D-21, D-25): contador, leídos y enlace ----

  it("el contador muestra los no leídos y dice cuántos hay", async () => {
    http.get.mockResolvedValue({ data: lista([PASE, SCTR, LEIDO]) })
    pintar()
    expect(await screen.findByRole("button", { name: "Avisos, 2 sin leer" })).toBeTruthy()
    expect(screen.getByTestId("contador-avisos").textContent).toBe("2")
  })

  it("con más de 9 no leídos muestra 9+", async () => {
    const muchos = Array.from({ length: 12 }, (_, i) => aviso({ idNotificacion: 100 + i, titulo: `Aviso ${i}` }))
    http.get.mockResolvedValue({ data: lista(muchos) })
    pintar()
    await waitFor(() => expect(screen.getByTestId("contador-avisos").textContent).toBe("9+"))
  })

  it("al abrir un aviso lo marca como leído, baja el contador y lleva a su enlace", async () => {
    http.get.mockResolvedValue({ data: lista([OTRO, PASE]) })
    pintar()
    await screen.findByRole("button", { name: "Avisos, 2 sin leer" })
    fireEvent.click(campana())
    await act(async () => {
      fireEvent.click(await screen.findByText(OTRO.titulo))
    })
    expect(http.patch).toHaveBeenCalledWith("/notificaciones/3/leida")
    expect(await screen.findByText("Detalle de la cotización")).toBeTruthy()
    expect(screen.getByTestId("contador-avisos").textContent).toBe("1")
  })

  it("un aviso ya leído no se vuelve a marcar", async () => {
    http.get.mockResolvedValue({ data: lista([LEIDO]) })
    pintar()
    fireEvent.click(campana())
    await act(async () => {
      fireEvent.click(await screen.findByText(LEIDO.titulo))
    })
    expect(http.patch).not.toHaveBeenCalled()
    expect(screen.queryByTestId("contador-avisos")).toBeNull()
  })

  it("marca todos los no leídos de una vez", async () => {
    http.get.mockResolvedValue({ data: lista([PASE, SCTR, LEIDO]) })
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: "Avisos, 2 sin leer" }))
    await act(async () => {
      fireEvent.click(await screen.findByRole("button", { name: /marcar todos como leídos/i }))
    })
    await waitFor(() => expect(http.patch).toHaveBeenCalledTimes(2))
    expect(http.patch).toHaveBeenCalledWith("/notificaciones/1/leida")
    expect(http.patch).toHaveBeenCalledWith("/notificaciones/2/leida")
    expect(screen.queryByTestId("contador-avisos")).toBeNull()
  })

  it("se cierra con Escape", async () => {
    http.get.mockResolvedValue({ data: lista([PASE]) })
    pintar()
    fireEvent.click(campana())
    expect(await screen.findByRole("dialog", { name: "Lista de avisos" })).toBeTruthy()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(screen.queryByRole("dialog", { name: "Lista de avisos" })).toBeNull()
  })
})
