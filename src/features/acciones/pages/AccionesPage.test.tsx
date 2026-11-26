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

describe("acciones correctivas: mejoras v3.4", () => {
  const META_NO_CUMPLE = {
    anio: 2026, mes: 11, metaPorcentaje: 90, cotizacionesEnPlazo: 17, cotizacionesConsideradas: 20, porcentaje: 85, cumple: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    http.get.mockImplementation((url: string) => {
      if (String(url).endsWith("/acciones")) return Promise.resolve({ data: ACCIONES })
      if (url === "/metas") return Promise.resolve({ data: META_NO_CUMPLE })
      return Promise.resolve({ data: [] })
    })
    http.post.mockResolvedValue({ data: ACCIONES[0] })
    http.patch.mockResolvedValue({ data: ACCIONES[1] })
  })

  it("muestra el resultado de la meta del mes que motiva las acciones", async () => {
    pintar("GERENTE_GENERAL")
    const resultado = await screen.findByRole("region", { name: "Resultado de la meta del mes" })
    expect(resultado.textContent).toMatch(/85% en plazo/)
    expect(resultado.textContent).toMatch(/17 de 20/)
    expect(resultado.textContent).toMatch(/no cumple/)
  })

  it("cuenta pendientes y hechas, y pone primero las pendientes", async () => {
    pintar("GERENTE_GENERAL")
    expect(await screen.findByText("1 pendiente · 1 hecha")).toBeTruthy()
    const filas = screen.getAllByRole("listitem")
    expect(filas[0].textContent).toMatch(/Llamar al cliente/)
    expect(filas[1].textContent).toMatch(/Archivar el expediente/)
  })

  it("el Jefe puede reabrir una acción marcada como hecha por error", async () => {
    pintar("JEFE_ADMINISTRATIVO")
    fireEvent.click(await screen.findByRole("button", { name: "Reabrir" }))
    await vi.waitFor(() => expect(http.patch).toHaveBeenCalledWith("/metas/acciones/2", { estado: "PENDIENTE" }))
  })

  it("marcar como hecha envía HECHA", async () => {
    pintar("JEFE_ADMINISTRATIVO")
    fireEvent.click(await screen.findByRole("button", { name: "Marcar como hecha" }))
    await vi.waitFor(() => expect(http.patch).toHaveBeenCalledWith("/metas/acciones/1", { estado: "HECHA" }))
  })

  it("navega al mes anterior y no ofrece meses futuros", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-11-20T15:00:00Z"))
    try {
      pintar("GERENTE_GENERAL")
      await screen.findByText("Llamar al cliente")
      expect(screen.getByRole("link", { name: "Mes anterior" }).getAttribute("href")).toBe("/acciones?anio=2026&mes=10")
      expect(screen.queryByRole("link", { name: "Mes siguiente" })).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it("Ctrl + Enter registra la acción y el contador respeta el límite", async () => {
    pintar("JEFE_ADMINISTRATIVO")
    const caja = await screen.findByLabelText("Descripción")
    expect(caja.getAttribute("maxLength")).toBe("500")
    fireEvent.change(caja, { target: { value: "Revisar las solicitudes atrasadas" } })
    expect(screen.getByText("33/500")).toBeTruthy()
    fireEvent.keyDown(caja, { key: "Enter", ctrlKey: true })
    await vi.waitFor(() => expect(http.post).toHaveBeenCalledWith("/metas/2026/11/acciones", { descripcion: "Revisar las solicitudes atrasadas" }))
  })

  it("sin acciones, el vacío explica cuándo se registran", async () => {
    http.get.mockImplementation((url: string) => Promise.resolve({ data: String(url).endsWith("/acciones") ? [] : META_NO_CUMPLE }))
    pintar("JEFE_ADMINISTRATIVO")
    expect(await screen.findByText(/Si el mes no llega a la meta, registra arriba/)).toBeTruthy()
  })
})
