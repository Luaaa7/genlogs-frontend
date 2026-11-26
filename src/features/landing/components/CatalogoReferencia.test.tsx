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

  it("mientras carga muestra 8 tarjetas fantasma y al resolver las reemplaza por los productos", async () => {
    let resolver!: (v: unknown) => void
    api.listarCatalogo.mockReturnValue(new Promise((r) => { resolver = r }))
    pintar()

    const aviso = screen.getByRole("status", { name: "Cargando catálogo" })
    expect(within(aviso).getAllByTestId("esqueleto-repuesto")).toHaveLength(8)
    expect(screen.queryAllByRole("article")).toHaveLength(0)

    resolver([{ id: 1, nombre: "Adaptador Linksys", categoria: "Componentes y Accesorios", imagenUrl: null }])
    expect(await screen.findAllByRole("article")).toHaveLength(1)
    expect(screen.queryByTestId("esqueleto-repuesto")).toBeNull()
    expect(screen.queryByRole("status", { name: "Cargando catálogo" })).toBeNull()
  })
})
