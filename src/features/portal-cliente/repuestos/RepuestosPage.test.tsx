import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { RepuestoPortal } from "./repuestosApi"

const api = vi.hoisted(() => ({ listar: vi.fn(), pedirCotizacion: vi.fn() }))
vi.mock("./repuestosApi", () => ({ repuestosApi: api }))
const portal = vi.hoisted(() => ({ listarPedidos: vi.fn(), subirFotoSolicitud: vi.fn() }))
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

  it("Volver a pedir: sin N.º de parte con marca, o foto, no deja pedir (D-01)", async () => {
    api.pedirCotizacion.mockResolvedValue({ idSolicitud: 4, codigoSolicitud: "SOL-4", estado: "PENDIENTE" })
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /volver a pedir plancha de desgaste/i }))
    const carrito = screen.getByRole("complementary")
    const pedir = within(carrito).getByRole("button", { name: /pedir cotización/i }) as HTMLButtonElement
    expect(pedir.disabled).toBe(true)
    expect(within(carrito).getByText(/a 1 repuesto le falta/i)).toBeTruthy()

    fireEvent.change(within(carrito).getByLabelText(/n\.º de parte de plancha de desgaste/i), { target: { value: "PD-200" } })
    expect(within(carrito).getByText(/indica la marca/i)).toBeTruthy()
    expect(pedir.disabled).toBe(true)

    fireEvent.change(within(carrito).getByLabelText(/marca de plancha de desgaste/i), { target: { value: "Hardox" } })
    expect(pedir.disabled).toBe(false)
    fireEvent.click(pedir)
    await waitFor(() => expect(api.pedirCotizacion).toHaveBeenCalled())
    expect(api.pedirCotizacion.mock.calls[0][0]).toEqual([
      expect.objectContaining({ descripcion: "Plancha de desgaste", numeroParte: "PD-200", marca: "Hardox", cantidad: 4 }),
    ])
  })

  it("Volver a pedir: con una foto adjunta ya se puede pedir", async () => {
    portal.subirFotoSolicitud.mockResolvedValue("/uploads/solicitudes/plancha.jpg")
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /volver a pedir plancha de desgaste/i }))
    const carrito = screen.getByRole("complementary")
    const archivo = new File(["x"], "plancha.jpg", { type: "image/jpeg" })
    fireEvent.change(within(carrito).getByLabelText(/adjunta foto o plano de plancha de desgaste/i), { target: { files: [archivo] } })
    expect(await within(carrito).findByText(/foto adjunta/i)).toBeTruthy()
    expect(portal.subirFotoSolicitud).toHaveBeenCalledWith(archivo)
    expect((within(carrito).getByRole("button", { name: /pedir cotización/i }) as HTMLButtonElement).disabled).toBe(false)
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
