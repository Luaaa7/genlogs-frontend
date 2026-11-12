import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { RepuestoPublico } from "@/api/publicApi"

const api = vi.hoisted(() => ({ listarRepuestos: vi.fn(), listarCategoriasVitrina: vi.fn() }))
vi.mock("@/api/publicApi", () => ({ publicApi: api }))
const enviar = vi.hoisted(() => vi.fn())
vi.mock("../lib/enviarSolicitudLanding", () => ({ enviarSolicitudLanding: enviar }))

import { VitrinaLanding } from "./VitrinaLanding"
import { leerPedidoPendiente } from "../lib/pedidoPendiente"

const filtro: RepuestoPublico = {
  idProducto: 1, nombre: "Filtro de combustible", descripcion: null, marca: "Caterpillar", numeroParte: "1R-0750",
  idCategoria: 3, categoria: "Filtros", tipoRepuesto: "OEM", plazoEntrega: "5 a 7 días hábiles", urlImagen: null,
}
const rodamiento: RepuestoPublico = {
  ...filtro, idProducto: 2, nombre: "Rodamiento 6205", marca: "SKF", numeroParte: "6205-2RS", idCategoria: 5,
  categoria: "Rodamientos", tipoRepuesto: "ALTERNATIVO", plazoEntrega: "24 a 48 horas", urlImagen: "https://res.cloudinary.com/x/6205.jpg",
}

function Registro() {
  const { search } = useLocation()
  return <p>registro{search}</p>
}

function pintar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<VitrinaLanding />} />
          <Route path="/portal/registro" element={<Registro />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("VitrinaLanding (RF-82, D-16, D-30)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    api.listarRepuestos.mockResolvedValue([filtro, rodamiento])
    api.listarCategoriasVitrina.mockResolvedValue([
      { idCategoria: 3, nombre: "Filtros", cantidad: 1 },
      { idCategoria: 5, nombre: "Rodamientos", cantidad: 1 },
    ])
  })

  it("muestra los repuestos sin precio, con foto propia o ícono, y los de foto primero", async () => {
    pintar()
    const tarjetas = await screen.findAllByRole("article")
    expect(within(tarjetas[0]).getByText("Rodamiento 6205")).toBeTruthy()
    expect(within(tarjetas[0]).getByRole("img", { name: "Rodamiento 6205" })).toBeTruthy()
    expect(within(tarjetas[1]).getByText(/foto referencial próximamente/i)).toBeTruthy()
    expect(screen.getByText("Original (OEM)")).toBeTruthy()
    expect(screen.getByText("Alternativo compatible")).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/S\/\s?\d|US\$|\$\s?\d/)
  })

  it("filtra por categoría y por búsqueda", async () => {
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /rodamientos/i }))
    await waitFor(() => expect(api.listarRepuestos).toHaveBeenLastCalledWith(expect.objectContaining({ idCategoria: 5 })))

    fireEvent.change(screen.getByLabelText(/buscar por nombre o n\.º de parte/i), { target: { value: " 1R-0750 " } })
    fireEvent.click(screen.getByRole("button", { name: /^buscar$/i }))
    await waitFor(() => expect(api.listarRepuestos).toHaveBeenLastCalledWith(expect.objectContaining({ q: "1R-0750" })))
  })

  it("sin cuenta, Cotizar guarda el producto y manda al registro", async () => {
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /cotizar filtro de combustible/i }))

    expect(await screen.findByText("registro?volver=%2F%23solicitud")).toBeTruthy()
    expect(leerPedidoPendiente()).toMatchObject({ idProducto: 1, numeroParte: "1R-0750", cantidad: 1 })
    expect(enviar).not.toHaveBeenCalled()
  })

  it("con sesión de cliente, Cotizar envía la solicitud y marca la tarjeta", async () => {
    localStorage.setItem("cliente_access_token", "tok")
    enviar.mockResolvedValue({ idSolicitud: 9, codigoSolicitud: "SOL-9", estado: "PENDIENTE" })
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /cotizar rodamiento 6205/i }))

    expect(await screen.findByText(/pedido enviado/i)).toBeTruthy()
    expect(enviar).toHaveBeenCalledWith(expect.objectContaining({ idProducto: 2, cantidad: 1 }), "tok")
  })

  it("sin resultados ofrece pedirlo en la solicitud rápida", async () => {
    api.listarRepuestos.mockResolvedValue([])
    pintar()
    expect(await screen.findByText(/vitrina en actualización/i)).toBeTruthy()
    expect(screen.getByRole("link", { name: /¿no está\? pídelo/i }).getAttribute("href")).toBe("#solicitud")
  })
})
