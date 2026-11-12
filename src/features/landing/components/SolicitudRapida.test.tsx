import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const enviar = vi.hoisted(() => vi.fn())
vi.mock("../lib/enviarSolicitudLanding", () => ({ enviarSolicitudLanding: enviar }))

import { SolicitudRapida } from "./SolicitudRapida"
import { guardarPedidoPendiente, leerPedidoPendiente } from "../lib/pedidoPendiente"

function Registro() {
  const { search } = useLocation()
  return <p>registro{search}</p>
}

function pintar() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<SolicitudRapida />} />
        <Route path="/portal/registro" element={<Registro />} />
      </Routes>
    </MemoryRouter>
    </QueryClientProvider>,
  )
}

function llenar() {
  fireEvent.change(screen.getByLabelText(/^marca/i), { target: { value: "Caterpillar" } })
  fireEvent.change(screen.getByLabelText(/n\.º de parte/i), { target: { value: "1R-0750" } })
  fireEvent.change(screen.getByLabelText(/qué repuesto necesitas/i), { target: { value: "Filtro de combustible" } })
  fireEvent.change(screen.getByLabelText(/cantidad/i), { target: { value: "2" } })
}

describe("SolicitudRapida (D-16, D-30)", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("valida antes de enviar: descripción y marca si hay N.º de parte", async () => {
    pintar()
    fireEvent.change(screen.getByLabelText(/n\.º de parte/i), { target: { value: "1R-0750" } })
    fireEvent.click(screen.getByRole("button", { name: /pedir cotización/i }))
    expect(await screen.findByText(/cuéntanos qué repuesto necesitas/i)).toBeTruthy()
    expect(screen.getByText(/indica la marca del n\.º de parte/i)).toBeTruthy()
    expect(enviar).not.toHaveBeenCalled()
  })

  it("sin cuenta guarda el pedido y manda al registro con ?volver=", async () => {
    pintar()
    llenar()
    fireEvent.click(screen.getByRole("button", { name: /pedir cotización/i }))

    expect(await screen.findByText("registro?volver=%2F%23solicitud")).toBeTruthy()
    expect(leerPedidoPendiente()).toMatchObject({ numeroParte: "1R-0750", descripcion: "Filtro de combustible", cantidad: 2 })
    expect(enviar).not.toHaveBeenCalled()
  })

  it("con sesión de cliente envía directo y muestra el código", async () => {
    localStorage.setItem("cliente_access_token", "tok")
    enviar.mockResolvedValue({ idSolicitud: 7, codigoSolicitud: "SOL-7", estado: "PENDIENTE" })
    pintar()
    llenar()
    fireEvent.click(screen.getByRole("button", { name: /pedir cotización/i }))

    expect(await screen.findByText(/recibimos tu pedido sol-7/i)).toBeTruthy()
    expect(enviar).toHaveBeenCalledWith(
      { marca: "Caterpillar", numeroParte: "1R-0750", descripcion: "Filtro de combustible", cantidad: 2 },
      "tok",
    )
  })

  it("al volver del registro envía solo el pedido guardado y lo borra", async () => {
    guardarPedidoPendiente({ marca: "SKF", numeroParte: "6205", descripcion: "Rodamiento", cantidad: 4 })
    localStorage.setItem("cliente_access_token", "tok")
    enviar.mockResolvedValue({ idSolicitud: 8, codigoSolicitud: "SOL-8", estado: "PENDIENTE" })
    pintar()

    expect(await screen.findByText(/recibimos tu pedido sol-8/i)).toBeTruthy()
    expect(enviar).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(leerPedidoPendiente()).toBeNull())
  })

  it("si el servicio aún no existe (501), avisa y conserva el pedido", async () => {
    guardarPedidoPendiente({ marca: "", numeroParte: "", descripcion: "Rodamiento", cantidad: 1 })
    localStorage.setItem("cliente_access_token", "tok")
    enviar.mockRejectedValue({ isAxiosError: true, response: { status: 501 } })
    pintar()

    expect(await screen.findByText(/todavía no está disponible/i)).toBeTruthy()
    expect(leerPedidoPendiente()).not.toBeNull()
    expect((screen.getByLabelText(/qué repuesto necesitas/i) as HTMLTextAreaElement).value).toBe("Rodamiento")
  })
})
