import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"

const api = vi.hoisted(() => ({ listarCatalogo: vi.fn() }))
vi.mock("@/api/publicApi", () => ({ publicApi: { ...api, listarCategoriasVitrina: vi.fn().mockResolvedValue([]) } }))
vi.mock("./components/Portada", () => ({ Portada: () => null }))
vi.mock("./components/PorQue", () => ({ PorQue: () => null }))
vi.mock("./components/ComoFunciona", () => ({ ComoFunciona: () => null }))
vi.mock("./components/CoberturaMinera", () => ({ CoberturaMinera: () => null }))
vi.mock("./components/Respaldo", () => ({ Respaldo: () => null }))

import { LandingPage } from "./LandingPage"
import { limpiarPrecarga } from "./lib/precargaSolicitud"
import { leerPedidoPendiente } from "./lib/pedidoPendiente"

function pintar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><LandingPage /></MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("Del catálogo a la Solicitud rápida (v3.4)", () => {
  beforeEach(() => {
    localStorage.clear()
    api.listarCatalogo.mockResolvedValue([
      { id: 1, nombre: "Adaptador Linksys", categoria: "Componentes y Accesorios", imagenUrl: null },
      { id: 2, nombre: "Anemómetro Digital", categoria: "Componentes y Accesorios", imagenUrl: null },
    ])
  })
  afterEach(() => limpiarPrecarga())

  it("sin elegir nada, el formulario está vacío y no avisa de ningún producto", async () => {
    pintar()
    await screen.findByText("Anemómetro Digital")
    expect((screen.getByLabelText(/qué repuesto necesitas/i) as HTMLTextAreaElement).value).toBe("")
    expect(screen.queryByText(/desde el catálogo/)).toBeNull()
  })

  it("«Pedir cotización» en un producto escribe ese producto en el formulario y mantiene el ancla", async () => {
    pintar()
    const tarjeta = (await screen.findByText("Anemómetro Digital")).closest("article") as HTMLElement
    const enlace = within(tarjeta).getByRole("link", { name: /Pedir cotización/ })
    expect(enlace.getAttribute("href")).toBe("#solicitud")
    fireEvent.click(enlace)

    expect((screen.getByLabelText(/qué repuesto necesitas/i) as HTMLTextAreaElement).value).toBe("Anemómetro Digital")
    expect((screen.getByLabelText(/^marca/i) as HTMLInputElement).value).toBe("")
    expect(screen.getByRole("status").textContent).toContain("Anemómetro Digital")
  })

  it("elegir otro producto reemplaza el anterior y respeta la cantidad ya escrita", async () => {
    pintar()
    const primera = (await screen.findByText("Anemómetro Digital")).closest("article") as HTMLElement
    fireEvent.click(within(primera).getByRole("link", { name: /Pedir cotización/ }))
    fireEvent.change(screen.getByLabelText(/cantidad/i), { target: { value: "5" } })
    fireEvent.change(screen.getByLabelText(/^marca/i), { target: { value: "Davis" } })

    const segunda = screen.getByText("Adaptador Linksys").closest("article") as HTMLElement
    fireEvent.click(within(segunda).getByRole("link", { name: /Pedir cotización/ }))

    expect((screen.getByLabelText(/qué repuesto necesitas/i) as HTMLTextAreaElement).value).toBe("Adaptador Linksys")
    expect((screen.getByLabelText(/^marca/i) as HTMLInputElement).value).toBe("")
    expect((screen.getByLabelText(/cantidad/i) as HTMLInputElement).value).toBe("5")
  })

  it("el producto precargado se puede enviar como cualquier otro pedido", async () => {
    pintar()
    const tarjeta = (await screen.findByText("Anemómetro Digital")).closest("article") as HTMLElement
    fireEvent.click(within(tarjeta).getByRole("link", { name: /Pedir cotización/ }))
    fireEvent.click(screen.getByRole("button", { name: "Pedir cotización" }))
    // Sin cuenta, el pedido se guarda para el registro (D-16); no hay error de validación.
    await vi.waitFor(() => expect(leerPedidoPendiente()).toMatchObject({ descripcion: "Anemómetro Digital", cantidad: 1 }))
    expect(screen.queryByText(/cuéntanos qué repuesto necesitas/i)).toBeNull()
  })
})
