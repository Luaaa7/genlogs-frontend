import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const api = vi.hoisted(() => ({ listarCatalogo: vi.fn() }))
vi.mock("@/api/publicApi", () => ({ publicApi: api }))

import { CatalogoReferencia } from "./CatalogoReferencia"

function pintar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <CatalogoReferencia />
    </QueryClientProvider>,
  )
}

describe("CatalogoReferencia", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.listarCatalogo.mockResolvedValue([
      { id: 1, nombre: "Adaptador Linksys", categoria: "Componentes y Accesorios", imagenUrl: null },
      { id: 2, nombre: "Anemómetro Digital", categoria: "Componentes y Accesorios", imagenUrl: "https://res.cloudinary.com/x/a.jpg" },
    ])
  })

  it("muestra la foto de Cloudinary y pone primero los productos con foto", async () => {
    pintar()
    const tarjetas = await screen.findAllByRole("article")
    expect(within(tarjetas[0]).getByRole("img", { name: "Anemómetro Digital" })).toBeTruthy()
    expect(within(tarjetas[1]).queryByRole("img")).toBeNull()
  })

  it("si la foto no carga, muestra la ilustración", async () => {
    pintar()
    const foto = await screen.findByRole("img", { name: "Anemómetro Digital" })
    fireEvent.error(foto)
    expect(screen.queryByRole("img", { name: "Anemómetro Digital" })).toBeNull()
    expect(screen.getByText("Anemómetro Digital")).toBeTruthy()
  })
})