import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { portalComprobantesApi, type ComprobantePortal } from "@/api/portalComprobantesApi"
import { navegacionExterna } from "../lib/navegacionExterna"
import { MisComprobantesPage } from "./MisComprobantesPage"
import { PagoResultadoPage } from "./PagoResultadoPage"

function renderEn(ruta: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/portal/comprobantes" element={<MisComprobantesPage />} />
          <Route path="/portal/comprobantes/pago" element={<PagoResultadoPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const enSoles: ComprobantePortal = {
  id: 1, comprobante: "F001-00000001", tipo: "Factura", fechaEmision: "2026-11-20", fechaVencimiento: "2026-12-20",
  total: 1180, montoPagado: 180, saldoPendiente: 1000, moneda: "PEN", estado: "Pago parcial", codigoEstado: "PARCIAL",
  puedePagarEnLinea: true, motivoSinPago: null,
}
const enDolares: ComprobantePortal = {
  ...enSoles, id: 2, comprobante: "F001-00000002", moneda: "USD", estado: "Emitida", codigoEstado: "EMITIDA",
  puedePagarEnLinea: false,
  motivoSinPago: "El pago en línea es solo para comprobantes en soles. Para dólares, paga por transferencia.",
}

describe("Mis comprobantes (portal, BPMN 4.1)", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("lista los comprobantes con su saldo y solo ofrece pagar el que se puede", async () => {
    vi.spyOn(portalComprobantesApi, "listar").mockResolvedValue([enSoles, enDolares])
    renderEn("/portal/comprobantes")

    expect(await screen.findByText("F001-00000001")).toBeTruthy()
    expect(screen.getByText("F001-00000002")).toBeTruthy()
    expect(screen.getAllByRole("button", { name: /Pagar en línea/ })).toHaveLength(1)
    expect(screen.getByText(/solo para comprobantes en soles/)).toBeTruthy()
    expect(screen.getAllByText(/1,000\.00|1 000,00|1\.000,00/).length).toBeGreaterThan(0)
  })

  it("al pagar pide el enlace por ese comprobante y lleva al checkout de Mercado Pago", async () => {
    vi.spyOn(portalComprobantesApi, "listar").mockResolvedValue([enSoles])
    const pagar = vi.spyOn(portalComprobantesApi, "pagar").mockResolvedValue({ urlPago: "https://mercadopago.test/checkout/1" })
    const ir = vi.spyOn(navegacionExterna, "ir").mockImplementation(() => {})
    renderEn("/portal/comprobantes")

    fireEvent.click(await screen.findByRole("button", { name: /Pagar en línea/ }))

    await waitFor(() => expect(ir).toHaveBeenCalledWith("https://mercadopago.test/checkout/1"))
    expect(pagar).toHaveBeenCalledWith(1)
  })

  it("si el backend no deja pagar, muestra su mensaje y no sale del portal", async () => {
    vi.spyOn(portalComprobantesApi, "listar").mockResolvedValue([enSoles])
    vi.spyOn(portalComprobantesApi, "pagar").mockRejectedValue({
      isAxiosError: true, response: { status: 400, data: { message: "El comprobante ya está pagado." } },
    })
    const ir = vi.spyOn(navegacionExterna, "ir").mockImplementation(() => {})
    renderEn("/portal/comprobantes")

    fireEvent.click(await screen.findByRole("button", { name: /Pagar en línea/ }))

    expect(await screen.findByText("El comprobante ya está pagado.")).toBeTruthy()
    expect(ir).not.toHaveBeenCalled()
  })

  it("sin comprobantes muestra un mensaje claro", async () => {
    vi.spyOn(portalComprobantesApi, "listar").mockResolvedValue([])
    renderEn("/portal/comprobantes")
    expect(await screen.findByText(/todavía no tienes comprobantes/i)).toBeTruthy()
  })
})

describe("Regreso del checkout", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("confirma el pago una sola vez con el payment_id y muestra el resultado", async () => {
    const confirmar = vi.spyOn(portalComprobantesApi, "confirmar").mockResolvedValue({
      estado: "REGISTRADO", mensaje: "¡Pago recibido! Registramos S/ 1000.00 en el comprobante F001-00000001.",
      idComprobante: 1, comprobante: "F001-00000001", monto: 1000, saldoPendiente: 0,
    })
    renderEn("/portal/comprobantes/pago?payment_id=123456&status=approved")

    expect(await screen.findByText("Pago recibido")).toBeTruthy()
    expect(screen.getByText(/F001-00000001/)).toBeTruthy()
    expect(confirmar).toHaveBeenCalledTimes(1)
    expect(confirmar).toHaveBeenCalledWith("123456")
  })

  it("un pago en proceso se muestra en revisión, sin decir que se cobró", async () => {
    vi.spyOn(portalComprobantesApi, "confirmar").mockResolvedValue({
      estado: "PENDIENTE", mensaje: "Tu pago está en proceso. Lo registraremos apenas Mercado Pago lo confirme.",
    })
    renderEn("/portal/comprobantes/pago?payment_id=99&status=in_process")

    expect(await screen.findByText("Pago en revisión")).toBeTruthy()
    expect(screen.queryByText("Pago recibido")).toBeNull()
  })

  it("sin payment_id no consulta nada y dice que no se cobró", async () => {
    const confirmar = vi.spyOn(portalComprobantesApi, "confirmar")
    renderEn("/portal/comprobantes/pago?status=null")

    expect(await screen.findByText("El pago no se completó")).toBeTruthy()
    expect(confirmar).not.toHaveBeenCalled()
    expect(screen.getByRole("link", { name: "Volver a mis comprobantes" }).getAttribute("href")).toBe("/portal/comprobantes")
  })
})