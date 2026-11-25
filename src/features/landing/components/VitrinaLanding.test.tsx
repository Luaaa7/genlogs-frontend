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
import { cerrarCarrito, leerCarrito } from "@/lib/carritoPublico"

const filtro: RepuestoPublico = {
  idProducto: 1, nombre: "Filtro de combustible", descripcion: null, marca: "Caterpillar", numeroParte: "1R-0750",
  idCategoria: 3, categoria: "Filtros", tipoRepuesto: "OEM", plazoEntrega: "5 a 7 días hábiles", urlImagen: null,
}
const rodamiento: RepuestoPublico = {
  ...filtro, idProducto: 2, nombre: "Rodamiento 6205", marca: "SKF", numeroParte: "6205-2RS", idCategoria: 5,
  categoria: "Rodamientos", tipoRepuesto: "ALTERNATIVO", plazoEntrega: "24 a 48 horas", urlImagen: "https://res.cloudinary.com/x/6205.jpg",
}

function Ruta() {
  const { pathname } = useLocation()
  return <p>ruta {pathname}</p>
}

function pintar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<VitrinaLanding />} />
          <Route path="*" element={<Ruta />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("VitrinaLanding (RF-82, D-16, D-30)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    cerrarCarrito()
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

  it("el texto superior invita a agregar repuestos y a crear el acceso con el RUC", async () => {
    pintar()
    await screen.findAllByRole("article")
    expect(
      screen.getByText(
        "Agrega los repuestos que necesitas y pide la cotización de todos juntos. Para cotizar te pediremos crear tu acceso con el RUC de tu empresa.",
      ),
    ).toBeTruthy()
  })

  it("Cotizar agrega el repuesto al carrito, sin enviar nada ni cambiar de página", async () => {
    localStorage.setItem("cliente_access_token", "tok") // aun con sesión de cliente no hay envío directo (canal VITRINA)
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /cotizar filtro de combustible/i }))
    expect(enviar).not.toHaveBeenCalled()

    expect(leerCarrito()).toEqual([
      { id: 1, nombre: "Filtro de combustible", marca: "Caterpillar", numeroParte: "1R-0750", cantidad: 1 },
    ])
    expect(screen.queryByText(/^ruta /)).toBeNull()
    expect(screen.getAllByRole("article")).toHaveLength(2)
  })

  it("la tarjeta muestra «En cotización (N)» y los controles - y + suben o bajan la cantidad", async () => {
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /cotizar rodamiento 6205/i }))
    const tarjeta = screen.getAllByRole("article")[0]
    expect(within(tarjeta).getByText("En cotización (1)")).toBeTruthy()

    fireEvent.click(within(tarjeta).getByRole("button", { name: /aumentar cantidad de rodamiento 6205/i }))
    expect(within(tarjeta).getByText("En cotización (2)")).toBeTruthy()
    expect(leerCarrito()[0].cantidad).toBe(2)

    fireEvent.click(within(tarjeta).getByRole("button", { name: /disminuir cantidad de rodamiento 6205/i }))
    expect(within(tarjeta).getByText("En cotización (1)")).toBeTruthy()
  })

  it("restar con una sola unidad saca el repuesto del carrito y vuelve «Cotizar»", async () => {
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /cotizar rodamiento 6205/i }))

    fireEvent.click(screen.getByRole("button", { name: /disminuir cantidad de rodamiento 6205/i }))

    expect(leerCarrito()).toEqual([])
    expect(screen.getByRole("button", { name: /cotizar rodamiento 6205/i })).toBeTruthy()
  })

  it("se puede cotizar más de un repuesto a la vez", async () => {
    pintar()
    fireEvent.click(await screen.findByRole("button", { name: /cotizar rodamiento 6205/i }))
    fireEvent.click(screen.getByRole("button", { name: /cotizar filtro de combustible/i }))

    expect(leerCarrito().map((i) => i.id)).toEqual([2, 1])
  })

  it("al volver a la página, las tarjetas recuerdan lo que ya estaba en el carrito", async () => {
    localStorage.setItem(
      "genlogs_public_cart",
      JSON.stringify([{ id: 1, nombre: "Filtro de combustible", marca: "Caterpillar", numeroParte: "1R-0750", cantidad: 4 }]),
    )
    pintar()
    expect(await screen.findByText("En cotización (4)")).toBeTruthy()
  })

  it("sin resultados ofrece pedirlo en la solicitud rápida", async () => {
    api.listarRepuestos.mockResolvedValue([])
    pintar()
    expect(await screen.findByText(/vitrina en actualización/i)).toBeTruthy()
    expect(screen.getByRole("link", { name: /¿no está\? pídelo/i }).getAttribute("href")).toBe("#solicitud")
  })
})
