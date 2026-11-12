import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { portalReclamosApi, type ReclamoPortal } from "@/api/portalReclamosApi"
import { MisReclamosPage } from "./MisReclamosPage"
import { ReclamoPortalDetallePage } from "./ReclamoPortalDetallePage"

function renderEn(ruta: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/portal/reclamos" element={<MisReclamosPage />} />
          <Route path="/portal/reclamos/:id" element={<ReclamoPortalDetallePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const abierto: ReclamoPortal = {
  idReclamo: 3, codigoReclamo: "REC-2026-3", estado: "REGISTRADO", asunto: "Filtro llegó dañado",
  descripcion: "La caja venía rota", fechaRegistro: "2026-11-10T09:00:00", puedeCalificar: false,
}
const resuelto: ReclamoPortal = {
  ...abierto, idReclamo: 4, codigoReclamo: "REC-2026-4", estado: "RESUELTO", solucion: "Reponemos el filtro sin costo",
  puedeCalificar: true,
  historial: [{ estado: "REGISTRADO", fecha: "2026-11-10T09:00:00" }, { estado: "RESUELTO", fecha: "2026-11-11T16:30:00" }],
}

describe("Mis reclamos (portal)", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("lista los reclamos con su estado y avisa cuáles se pueden calificar", async () => {
    vi.spyOn(portalReclamosApi, "listar").mockResolvedValue([abierto, resuelto])
    renderEn("/portal/reclamos")

    expect(await screen.findByText("REC-2026-3")).toBeTruthy()
    expect(screen.getByText("Registrado")).toBeTruthy()
    expect(screen.getByText("Resuelto")).toBeTruthy()
    expect(screen.getByText("Califica la atención")).toBeTruthy()
  })

  it("sin reclamos muestra un mensaje claro", async () => {
    vi.spyOn(portalReclamosApi, "listar").mockResolvedValue([])
    renderEn("/portal/reclamos")
    expect(await screen.findByText(/no tienes reclamos/i)).toBeTruthy()
  })

  it("registra un reclamo nuevo con asunto y descripción", async () => {
    vi.spyOn(portalReclamosApi, "listar").mockResolvedValue([])
    const crear = vi.spyOn(portalReclamosApi, "crear").mockResolvedValue({ ...abierto, idReclamo: 9, codigoReclamo: "REC-2026-9" })
    renderEn("/portal/reclamos")
    await screen.findByText(/no tienes reclamos/i)

    fireEvent.click(screen.getByRole("button", { name: "Nuevo reclamo" }))
    fireEvent.change(screen.getByLabelText(/asunto/i), { target: { value: "  Pedido incompleto " } })
    fireEvent.change(screen.getByLabelText(/qué pasó/i), { target: { value: " Faltaron 2 filtros " } })
    fireEvent.click(screen.getByRole("button", { name: "Enviar reclamo" }))

    await waitFor(() => expect(crear).toHaveBeenCalledWith({ asunto: "Pedido incompleto", descripcion: "Faltaron 2 filtros" }))
    expect(await screen.findByText(/REC-2026-9/)).toBeTruthy()
  })

  it("no envía el reclamo sin asunto ni descripción", async () => {
    vi.spyOn(portalReclamosApi, "listar").mockResolvedValue([])
    const crear = vi.spyOn(portalReclamosApi, "crear")
    renderEn("/portal/reclamos")
    await screen.findByText(/no tienes reclamos/i)

    fireEvent.click(screen.getByRole("button", { name: "Nuevo reclamo" }))
    fireEvent.click(screen.getByRole("button", { name: "Enviar reclamo" }))

    expect(await screen.findByText("Escribe el asunto")).toBeTruthy()
    expect(screen.getByText("Cuéntanos qué pasó")).toBeTruthy()
    expect(crear).not.toHaveBeenCalled()
  })
})

describe("Detalle del reclamo y calificación", () => {
  beforeEach(() => vi.restoreAllMocks())

  it("muestra la solución, el historial y califica de 1 a 5 con comentario", async () => {
    vi.spyOn(portalReclamosApi, "detalle").mockResolvedValue(resuelto)
    const calificar = vi.spyOn(portalReclamosApi, "calificar").mockResolvedValue({ ...resuelto, calificacion: 4, puedeCalificar: false })
    renderEn("/portal/reclamos/4")

    expect(await screen.findByText("Reponemos el filtro sin costo")).toBeTruthy()
    expect(screen.getAllByText("Resuelto").length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole("radio", { name: "4 de 5" }))
    fireEvent.change(screen.getByLabelText(/comentario/i), { target: { value: " Rápidos " } })
    fireEvent.click(screen.getByRole("button", { name: "Enviar calificación" }))

    await waitFor(() => expect(calificar).toHaveBeenCalledWith(4, { puntaje: 4, comentario: "Rápidos" }))
  })

  it("no deja enviar la calificación sin elegir puntaje", async () => {
    vi.spyOn(portalReclamosApi, "detalle").mockResolvedValue(resuelto)
    const calificar = vi.spyOn(portalReclamosApi, "calificar")
    renderEn("/portal/reclamos/4")
    await screen.findByText("Reponemos el filtro sin costo")

    expect((screen.getByRole("button", { name: "Enviar calificación" }) as HTMLButtonElement).disabled).toBe(true)
    expect(calificar).not.toHaveBeenCalled()
  })

  it("si ya calificó muestra su puntaje y no el formulario", async () => {
    vi.spyOn(portalReclamosApi, "detalle").mockResolvedValue({ ...resuelto, puedeCalificar: false, calificacion: 5, comentarioCalificacion: "Excelente" })
    renderEn("/portal/reclamos/4")

    expect(await screen.findByText(/Tu calificación: 5 de 5/)).toBeTruthy()
    expect(screen.getByText("Excelente")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Enviar calificación" })).toBeNull()
  })

  it("si está registrado no muestra la calificación", async () => {
    vi.spyOn(portalReclamosApi, "detalle").mockResolvedValue(abierto)
    renderEn("/portal/reclamos/3")
    expect(await screen.findByText("La caja venía rota")).toBeTruthy()
    expect(screen.queryByRole("button", { name: "Enviar calificación" })).toBeNull()
  })
})
