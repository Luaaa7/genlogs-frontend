import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { reclamosApi } from "@/api/reclamosApi"
import type { ReclamoFiltros } from "@/types/reclamo.types"
import { ReclamosPage } from "./ReclamosPage"

vi.mock("../components/ReclamoFormPanel", () => ({ ReclamoFormPanel: () => null }))
vi.mock("@/lib/permisos", () => ({ usePermisos: () => ({ gestionarReclamos: true }) }))

/** Cuántos reclamos hay de cada estado, por tipo (lo que respondería el backend). */
const CUANTOS: Record<string, Record<string, number>> = {
  RECLAMO: { REGISTRADO: 2, EN_PROCESO: 1, RESUELTO: 3, CERRADO: 0, ANULADO: 0 },
  INCIDENCIA: { REGISTRADO: 1, EN_PROCESO: 0, RESUELTO: 0, CERRADO: 4, ANULADO: 1 },
}

function total(f: ReclamoFiltros): number {
  const tipos = f.tipo ? [f.tipo] : Object.keys(CUANTOS)
  return tipos.reduce((suma, t) => suma + (f.estado ? CUANTOS[t][f.estado] : Object.values(CUANTOS[t]).reduce((a, b) => a + b, 0)), 0)
}

function respuesta(f: ReclamoFiltros) {
  const n = total(f)
  return { content: [], totalElements: n, totalPages: n > 0 ? 1 : 0, number: 0, size: f.size ?? 10 }
}

function pintar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><ReclamosPage /></MemoryRouter>
    </QueryClientProvider>,
  )
}

function chip(grupo: string, nombre: RegExp) {
  return within(screen.getByRole("group", { name: grupo })).getByRole("button", { name: nombre })
}

describe("ReclamosPage", () => {
  beforeEach(() => {
    vi.spyOn(reclamosApi, "listar").mockImplementation(async (f: ReclamoFiltros = {}) => respuesta(f) as never)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("cada filtro de estado muestra cuántos hay", async () => {
    pintar()
    await waitFor(() => expect(chip("Filtrar por estado", /^Registrado/).textContent).toBe("Registrado3"))
    expect(chip("Filtrar por estado", /^En proceso/).textContent).toBe("En proceso1")
    expect(chip("Filtrar por estado", /^Cerrado/).textContent).toBe("Cerrado4")
    expect(chip("Filtrar por estado", /^Todos los estados/).textContent).toBe("Todos los estados12")
  })

  it("los conteos siguen el filtro de tipo", async () => {
    pintar()
    fireEvent.click(chip("Filtrar por tipo", /^Incidencias/))
    await waitFor(() => expect(chip("Filtrar por estado", /^Registrado/).textContent).toBe("Registrado1"))
    expect(chip("Filtrar por estado", /^Cerrado/).textContent).toBe("Cerrado4")
    expect(chip("Filtrar por estado", /^Resuelto/).textContent).toBe("Resuelto0")
  })

  it("si la carga tarda, avisa que el servidor se está activando", async () => {
    vi.mocked(reclamosApi.listar).mockReturnValue(new Promise(() => {}))
    vi.useFakeTimers()
    pintar()
    expect(screen.queryByText("Esto está tardando más de lo normal")).toBeNull()
    await act(async () => { vi.advanceTimersByTime(5000) })
    expect(screen.getByText("Esto está tardando más de lo normal")).toBeTruthy()
  })
})
