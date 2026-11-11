import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { RepuestoPortal } from "./repuestosApi"

const api = vi.hoisted(() => ({ listar: vi.fn(), pedirCotizacion: vi.fn() }))
vi.mock("./repuestosApi", () => ({ repuestosApi: api }))
const portal = vi.hoisted(() => ({ listarPedidos: vi.fn() }))
vi.mock("@/api/portalApi", () => ({ portalApi: portal }))

import { RepuestosPage } from "./RepuestosPage"

const filtro: RepuestoPortal = {
  idProducto: 1, nombre: "Filtro de combustible", descripcion: null, marca: "Caterpillar", numeroParte: "1R-0750",
  idCategoria: 3, categoria: "Filtros", unidad: "Unidad", tipoRepuesto: "OEM", plazoEntrega: "5 a 7 días hábiles",
  urlImagen: null, precioReferencial: 568.75, moneda: "PEN",
}
const rodamiento: RepuestoPortal = { ...filtro, idProducto: 2, nombre: "Rodamiento 6205", marca: "SKF", numeroParte: "6205-2RS", idCategoria: 5, categoria: "Rodamientos", precioReferencial: 48.5 }

function pintar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/portal/repuestos"]}>
        <Routes>
          <Route path="/portal/repuestos" element={<RepuestosPage />} />
          <Route path="/portal/pedidos" element={<p>mis pedidos</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("RepuestosPage (RF-82)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    api.listar.mockResolvedValue([filtro, rodamiento])
    portal.listarPedidos.mockResolvedValue([
      { id: 1, fecha: "2026-10-01", estado: "COTIZADA", items: [{ descripcion: "Plancha de desgaste", cantidad: 4, unidad: "Unidad" }] },
    ])
  })

  it("muestra precio referencial y plazo, y filtra por categoría", async () => {
    pintar()
    expect(await screen.findByText("Filtro de combustible")).toBeTruthy()
    expect(screen.getByText(/568\.75/)).toBeTruthy()
    expect(screen.getAllByText("5 a 7 días hábiles").length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole("button", { name: /rodamientos/i }))
    expect(screen.queryByText("Filtro de combustible")).toBeNull()
    expect(screen.getByText("Rodamiento 6205")).toBeTruthy()
  })

  it("arma el carrito con el total referencial y pide la cotización", async () => {
    api.pedirCotizacion.mockResolvedValue({ idSolicitud: 3, codigoSolicitud: "SOL-3", estado: "PENDIENTE" })
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /agregar filtro de combustible al pedido/i }))
    fireEvent.click(screen.getByRole("button", { name: /agregar rodamiento 6205 al pedido/i }))
    fireEvent.change(screen.getByLabelText(/cantidad de rodamiento 6205/i), { target: { value: "2" } })

    const carrito = screen.getByRole("complementary")
    expect(within(carrito).getByText(/665\.75/)).toBeTruthy() // 568.75 + 2 × 48.50

    fireEvent.click(within(carrito).getByRole("button", { name: /pedir cotización/i }))
    await waitFor(() => expect(api.pedirCotizacion).toHaveBeenCalled())
    expect(api.pedirCotizacion.mock.calls[0][0]).toEqual([
      expect.objectContaining({ idProducto: 1, cantidad: 1 }),
      expect.objectContaining({ idProducto: 2, cantidad: 2 }),
    ])
    expect(await screen.findByText("mis pedidos")).toBeTruthy()
    expect(localStorage.getItem("genlogs-carrito-repuestos")).toBeNull()
  })

  it("Lo que ya pediste: Volver a pedir lo agrega al carrito", async () => {
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /volver a pedir plancha de desgaste/i }))
    const carrito = screen.getByRole("complementary")
    expect(within(carrito).getByText("Plancha de desgaste")).toBeTruthy()
    expect((within(carrito).getByLabelText(/cantidad de plancha de desgaste/i) as HTMLInputElement).value).toBe("4")
  })

  it("si no está, ofrece pedirlo por solicitud", async () => {
    api.listar.mockResolvedValue([])
    pintar()
    expect(await screen.findByText(/no encontramos ese repuesto/i)).toBeTruthy()
    expect(screen.getAllByRole("link", { name: /pídelo/i })[0].getAttribute("href")).toBe("/portal/solicitud")
  })

  it("el carrito se conserva al volver a la página", async () => {
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /agregar filtro de combustible al pedido/i }))
    await waitFor(() => expect(localStorage.getItem("genlogs-carrito-repuestos")).toContain("Filtro de combustible"))
  })
})
