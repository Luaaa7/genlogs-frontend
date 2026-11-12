import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router-dom"
import { permisosDe } from "@/lib/permisos"
import { menuFeE } from "@/menu/fe-e"
import { rutasFeE } from "@/router/rutas/fe-e"

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}))
vi.mock("@/api/axiosClient", () => ({ axiosClient: http }))

import { useAuthStore } from "@/features/auth/store/authStore"
import { AccionesPage } from "./AccionesPage"

const ACCIONES = [
  { id: 1, anio: 2026, mes: 11, descripcion: "Llamar al cliente", estado: "PENDIENTE", fecha: "2026-11-12T10:00:00" },
  { id: 2, anio: 2026, mes: 11, descripcion: "Archivar el expediente", estado: "HECHA", fecha: "2026-11-10T10:00:00" },
]

function pintar(rol: string) {
  useAuthStore.setState({ nombreRol: rol })
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/acciones?anio=2026&mes=11"]}>
        <AccionesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe("acciones correctivas", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    http.get.mockImplementation((url: string) => {
      if (String(url).endsWith("/acciones")) return Promise.resolve({ data: ACCIONES })
      return Promise.resolve({ data: [] })
    })
    http.post.mockResolvedValue({ data: ACCIONES[0] })
    http.patch.mockResolvedValue({ data: { ...ACCIONES[0], estado: "HECHA" } })
  })

  it("la descripción vacía no se envía", async () => {
    pintar("JEFE_ADMINISTRATIVO")
    expect(await screen.findByText("Llamar al cliente")).toBeTruthy()
    fireEvent.change(screen.getByLabelText("Descripción"), { target: { value: "   " } })
    fireEvent.click(screen.getByRole("button", { name: "Registrar acción" }))
    expect(await screen.findByText("La descripción no puede ir vacía.")).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()
  })

  it("el Jefe ve el formulario y el botón de HECHA", async () => {
    pintar("JEFE_ADMINISTRATIVO")
    expect(await screen.findByText("Llamar al cliente")).toBeTruthy()
    expect(screen.getByLabelText("Descripción")).toBeTruthy()
    expect(screen.getAllByRole("button", { name: "Marcar como hecha" })).toHaveLength(1)
  })

  it("el Gerente ve la lista sin formulario y sin botón", async () => {
    pintar("GERENTE_GENERAL")
    expect(await screen.findByText("Llamar al cliente")).toBeTruthy()
    expect(screen.getByText("Archivar el expediente")).toBeTruthy()
    expect(screen.queryByLabelText("Descripción")).toBeNull()
    expect(screen.queryByRole("button", { name: "Marcar como hecha" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Registrar acción" })).toBeNull()
  })

  it("la ruta y el menú no aparecen para el asistente administrativo ni para el cliente", () => {
    const item = menuFeE.find((opcion) => opcion.path === "/acciones")
    expect(item?.grupo).toBe("Operación")
    expect(item?.visible?.(permisosDe("ASISTENTE_ADMINISTRATIVO"))).toBe(false)
    expect(item?.visible?.(permisosDe("CLIENTE"))).toBe(false)
    expect(item?.visible?.(permisosDe("GERENTE_GENERAL"))).toBe(true)
    expect(item?.visible?.(permisosDe("JEFE_ADMINISTRATIVO"))).toBe(true)

    for (const rol of ["ASISTENTE_ADMINISTRATIVO", "CLIENTE"]) {
      useAuthStore.setState({ nombreRol: rol })
      const router = createMemoryRouter(
        [...rutasFeE.internas, { path: "/dashboard", element: <h1>Panel</h1> }],
        { initialEntries: ["/acciones"] },
      )
      const vista = render(<RouterProvider router={router} />)
      expect(screen.getByRole("heading", { name: "Panel" })).toBeTruthy()
      expect(screen.queryByRole("heading", { name: "Acciones correctivas" })).toBeNull()
      vista.unmount()
    }
  })
})
