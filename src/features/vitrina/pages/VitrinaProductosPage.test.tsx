import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const api = vi.hoisted(() => ({ convertir: vi.fn(), listar: vi.fn(), detalle: vi.fn(), agregarImagen: vi.fn(), accion: vi.fn() }))
vi.mock("@/api/vitrinaApi", () => ({ vitrinaApi: api }))

import { useAuthStore } from "@/features/auth/store/authStore"
import { VitrinaProductosPage } from "./VitrinaProductosPage"

const producto = {
  idProducto: 9, codigo: "GLB-000109", nombre: "Filtro de combustible", categoria: "Filtros", estado: "BORRADOR",
  precioReferencial: 728, margen: 60, requiereJefe: true, tieneImagenVerificada: false, imagenes: [],
}

function pintar(rol: string, ruta = "/vitrina/productos") {
  useAuthStore.setState({ nombreRol: rol })
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[ruta]}>
        <VitrinaProductosPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("VitrinaProductosPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.listar.mockResolvedValue([producto])
  })

  it("el Jefe ve el margen y el aviso de fuera de rango", async () => {
    pintar("JEFE_ADMINISTRATIVO")
    expect(await screen.findByRole("link", { name: "Filtro de combustible" })).toBeTruthy()
    expect(screen.getByText("60 %")).toBeTruthy()
    expect(screen.getByLabelText(/margen fuera de rango/i)).toBeTruthy()
    expect(screen.getByText(/falta la foto propia/i)).toBeTruthy()
  })

  it("el Asistente Administrativo no ve márgenes", async () => {
    pintar("ASISTENTE_ADMINISTRATIVO")
    await screen.findByRole("link", { name: "Filtro de combustible" })
    expect(screen.queryByText("60 %")).toBeNull()
  })

  it("abre filtrado con ?estado=OCULTO (enlace del aviso de verificación)", async () => {
    pintar("ASISTENTE_LOGISTICO", "/vitrina/productos?estado=OCULTO")
    await waitFor(() => expect(api.listar).toHaveBeenCalledWith("OCULTO"))
  })
})
