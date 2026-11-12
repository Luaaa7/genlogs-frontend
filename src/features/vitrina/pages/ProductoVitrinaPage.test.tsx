import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ProductoVitrina } from "@/api/vitrinaApi"

const api = vi.hoisted(() => ({ convertir: vi.fn(), listar: vi.fn(), detalle: vi.fn(), agregarImagen: vi.fn(), accion: vi.fn() }))
vi.mock("@/api/vitrinaApi", () => ({ vitrinaApi: api }))
vi.mock("@/components/ui/FileUploader", () => ({
  FileUploader: ({ onUploaded }: { onUploaded: (r: { url: string }) => void }) => (
    <button type="button" onClick={() => onUploaded({ url: "https://res.cloudinary.com/x/foto.jpg" })}>subir foto</button>
  ),
}))

import { useAuthStore } from "@/features/auth/store/authStore"
import { ProductoVitrinaPage } from "./ProductoVitrinaPage"

const base: ProductoVitrina = {
  idProducto: 9, codigo: "GLB-000109", nombre: "Filtro de combustible", descripcion: null, idCategoria: 3,
  categoria: "Filtros", idUnidadMedida: 1, unidad: "Unidad", marca: "Caterpillar", numeroParte: "1R-0750",
  tipoRepuesto: "OEM", origen: "IMPORTADO", estado: "BORRADOR", costoPuestoLima: 455, margen: 25,
  precioReferencial: 568.75, evaluacionMargen: "NORMAL", requiereJefe: false, tieneImagenVerificada: false,
  fechaUltimaVerificacion: null, imagenes: [],
}
const conFoto: Partial<ProductoVitrina> = {
  tieneImagenVerificada: true,
  imagenes: [{ idImagen: 1, url: "https://res.cloudinary.com/x/1.jpg", fuente: "RECEPCION", principal: true, verificada: true }],
}

function pintar(rol: string, producto: ProductoVitrina) {
  useAuthStore.setState({ nombreRol: rol })
  api.detalle.mockResolvedValue(producto)
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/vitrina/productos/9"]}>
        <Routes>
          <Route path="/vitrina/productos/:id" element={<ProductoVitrinaPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("ProductoVitrinaPage (RF-79, D-26)", () => {
  beforeEach(() => vi.clearAllMocks())

  it("sin foto propia no deja publicar y dice por qué", async () => {
    pintar("ASISTENTE_LOGISTICO", base)
    const publicar = await screen.findByRole("button", { name: /publicar/i })
    expect((publicar as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(/sube una foto propia para poder publicar/i)).toBeTruthy()
  })

  it("sube la foto con su fuente y queda verificada", async () => {
    api.agregarImagen.mockResolvedValue({ ...base, ...conFoto })
    pintar("ASISTENTE_LOGISTICO", base)
    expect(await screen.findByText(/elige primero de dónde es la foto/i)).toBeTruthy()

    fireEvent.change(screen.getByLabelText(/de dónde es la foto/i), { target: { value: "RECEPCION" } })
    fireEvent.click(screen.getByRole("button", { name: /subir foto/i }))

    await waitFor(() => expect(api.agregarImagen).toHaveBeenCalledWith(9, {
      urlImagen: "https://res.cloudinary.com/x/foto.jpg", fuente: "RECEPCION", principal: true,
    }))
    expect(await screen.findByText("Verificada")).toBeTruthy()
  })

  it("con foto, el asistente publica", async () => {
    api.accion.mockResolvedValue({ ...base, ...conFoto, estado: "PUBLICADO" })
    pintar("ASISTENTE_LOGISTICO", { ...base, ...conFoto })
    fireEvent.click(await screen.findByRole("button", { name: /publicar/i }))
    await waitFor(() => expect(api.accion).toHaveBeenCalledWith(9, "publicar"))
    expect(await screen.findByText("Publicado")).toBeTruthy()
  })

  it("margen fuera de rango: el asistente no publica y el Jefe sí (D-26)", async () => {
    const fuera = { ...base, ...conFoto, margen: 60, evaluacionMargen: "FUERA_DE_RANGO" as const, requiereJefe: true }
    pintar("ASISTENTE_LOGISTICO", fuera)
    expect(await screen.findByText(/solo el jefe administrativo puede publicarlo/i)).toBeTruthy()
    expect(screen.queryByRole("button", { name: /publicar/i })).toBeNull()
  })

  it("el Jefe ve el aviso del margen y publica desde la misma pantalla", async () => {
    const fuera = { ...base, ...conFoto, margen: 60, evaluacionMargen: "FUERA_DE_RANGO" as const, requiereJefe: true }
    api.accion.mockResolvedValue({ ...fuera, estado: "PUBLICADO" })
    pintar("JEFE_ADMINISTRATIVO", fuera)
    expect(await screen.findByText(/revísalo y, si estás de acuerdo, publícalo/i)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: /publicar/i }))
    await waitFor(() => expect(api.accion).toHaveBeenCalledWith(9, "publicar"))
  })

  it("el Gerente solo mira: sin botones ni subida de fotos", async () => {
    pintar("GERENTE_GENERAL", { ...base, ...conFoto })
    expect(await screen.findByText("Filtro de combustible")).toBeTruthy()
    expect(screen.queryByRole("button", { name: /publicar/i })).toBeNull()
    expect(screen.queryByLabelText(/de dónde es la foto/i)).toBeNull()
  })
})
