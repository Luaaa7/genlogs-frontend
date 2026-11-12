import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { Referencia } from "@/api/sourcingApi"

const api = vi.hoisted(() => ({ convertir: vi.fn(), listar: vi.fn(), detalle: vi.fn(), agregarImagen: vi.fn(), accion: vi.fn() }))
vi.mock("@/api/vitrinaApi", () => ({ vitrinaApi: api }))
vi.mock("@/api/categoriasApi", () => ({ listarCategoriasProducto: async () => [{ idCategoriaProducto: 3, nombreCategoria: "Filtros" }] }))
vi.mock("@/api/unidadesMedidaApi", () => ({
  listarUnidadesMedida: async () => [
    { idUnidadMedida: 7, codigoUnidad: "KG", nombreUnidad: "Kilogramo" },
    { idUnidadMedida: 1, codigoUnidad: "UND", nombreUnidad: "Unidad" },
  ],
}))
vi.mock("@/api/marcasApi", () => ({ listarMarcas: async () => [{ idMarca: 4, nombreMarca: "Caterpillar" }] }))

import { ConvertirModal } from "./ConvertirModal"

const ref: Referencia = {
  idSourcing: 7, idSolicitudItem: null, fuente: "AMAZON", metodo: "URL", titulo: "CAT 1R-0750 Fuel Filter",
  marca: "Caterpillar", numeroParte: "1R-0750", precioRef: 100, codigoMoneda: "USD", costoPuestoLima: 455,
  urlReferencia: "https://www.amazon.com/dp/X", urlImagenRef: null, estado: "UTIL", editadoAMano: false, creadoEn: "2026-11-11T10:00:00",
}

function pintar(r: Referencia = ref) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/busqueda"]}>
        <Routes>
          <Route path="/busqueda" element={<ConvertirModal referencia={r} onCerrar={() => {}} />} />
          <Route path="/vitrina/productos/:id" element={<p>detalle del producto</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("ConvertirModal (BPMN 10, D-22)", () => {
  beforeEach(() => vi.clearAllMocks())

  it("prellena lo de la referencia y deja «Unidad» por defecto", async () => {
    pintar()
    expect((screen.getByLabelText(/nombre en la vitrina/i) as HTMLInputElement).value).toBe("CAT 1R-0750 Fuel Filter")
    await waitFor(() => expect((screen.getByLabelText(/unidad de medida/i) as HTMLSelectElement).value).toBe("1"))
    expect((screen.getByLabelText(/costo puesto en lima/i) as HTMLInputElement).value).toBe("455")
    expect((screen.getByLabelText(/^origen/i) as HTMLSelectElement).value).toBe("IMPORTADO")
  })

  it("exige la categoría (D-22) y calcula el precio con el margen", async () => {
    pintar()
    await screen.findByRole("option", { name: "Filtros" })
    fireEvent.click(screen.getByRole("button", { name: /crear borrador/i }))
    expect(await screen.findByText(/elige la categoría/i)).toBeTruthy()
    expect(api.convertir).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/margen/i), { target: { value: "25" } })
    expect(await screen.findByText(/568\.75/)).toBeTruthy()
  })

  it("crea el borrador y abre su detalle", async () => {
    api.convertir.mockResolvedValue({ idProducto: 9, requiereJefe: false })
    pintar()
    await screen.findByRole("option", { name: "Filtros" })
    fireEvent.change(screen.getByLabelText(/categoría/i), { target: { value: "3" } })
    fireEvent.click(screen.getByLabelText(/alternativo compatible/i))
    fireEvent.click(screen.getByRole("button", { name: /crear borrador/i }))

    await waitFor(() => expect(api.convertir).toHaveBeenCalled())
    expect(api.convertir.mock.calls[0][0]).toMatchObject({
      idSourcing: 7, idCategoriaProducto: 3, idUnidadMedida: 1, numeroParte: "1R-0750",
      tipoRepuesto: "ALTERNATIVO", origen: "IMPORTADO", costoPuestoLima: 455,
    })
    expect(api.convertir.mock.calls[0][0].margen).toBeUndefined()
    expect(await screen.findByText("detalle del producto")).toBeTruthy()
  })

  it("sin costo en la referencia lo pide", async () => {
    pintar({ ...ref, costoPuestoLima: null })
    await screen.findByRole("option", { name: "Filtros" })
    fireEvent.change(screen.getByLabelText(/categoría/i), { target: { value: "3" } })
    fireEvent.click(screen.getByRole("button", { name: /crear borrador/i }))
    expect(await screen.findByText(/escribe el costo puesto en lima/i)).toBeTruthy()
  })
})
