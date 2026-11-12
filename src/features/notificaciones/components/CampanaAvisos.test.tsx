import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { AvisosResponse, NotificacionResponse } from "@/api/contratos/notificaciones"

const http = vi.hoisted(() => ({ get: vi.fn() }))
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

function pintar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <header>
        <CampanaAvisos />
        <button type="button">Buscar</button>
      </header>
    </QueryClientProvider>,
  )
}

function lista(avisos: NotificacionResponse[]): AvisosResponse {
  return { noLeidas: avisos.filter((a) => !a.leida).length, avisos }
}

describe("campana de avisos", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("muestra el pase a 7 días, el SCTR a 15 y cualquier otro tipo tal cual vienen", async () => {
    http.get.mockResolvedValue({ data: lista([PASE, SCTR, OTRO]) })
    pintar()
    fireEvent.click(screen.getByRole("button", { name: "Avisos" }))
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
    fireEvent.click(screen.getByRole("button", { name: "Avisos" }))
    expect(await screen.findByText("No hay avisos.")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Buscar" })).toBeTruthy()
  })

  it("si el GET falla, el resto del encabezado sigue", async () => {
    http.get.mockRejectedValue(new Error("sin avisos"))
    pintar()
    fireEvent.click(screen.getByRole("button", { name: "Avisos" }))
    expect(await screen.findByRole("alert")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Buscar" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Avisos" })).toBeTruthy()
  })
})
