import { fireEvent, render, screen, within } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AccesosPendientesPortal } from "./AccesosPendientesPortal"
import { activarAccesoPendiente, listarAccesosPendientes, rechazarAccesoPendiente } from "@/api/usuariosApi"

vi.mock("@/api/usuariosApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/api/usuariosApi")>()
  return {
    ...original,
    listarAccesosPendientes: vi.fn(),
    activarAccesoPendiente: vi.fn(),
    rechazarAccesoPendiente: vi.fn(),
  }
})

const PENDIENTES = [
  { idUsuario: 7, nombres: "Ana Ruiz", correo: "ana@minera.pe", empresa: "Minera Sol S.A.C.", ruc: "20123456789", fechaSolicitud: "2026-11-21T10:30:00", origen: "REGISTRO" as const },
  { idUsuario: 8, nombres: "Gina Paz", correo: "gina@gmail.com", empresa: "Minera Luna S.A.", ruc: "20987654321", fechaSolicitud: "2026-11-21T11:00:00", origen: "GOOGLE" as const },
]

function renderSeccion() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}><AccesosPendientesPortal /></QueryClientProvider>)
}

describe("AccesosPendientesPortal (BPMN 8.4)", () => {
  beforeEach(() => {
    vi.mocked(listarAccesosPendientes).mockReset()
    vi.mocked(activarAccesoPendiente).mockReset()
    vi.mocked(rechazarAccesoPendiente).mockReset()
  })

  it("lista los accesos pendientes con su empresa, RUC y origen", async () => {
    vi.mocked(listarAccesosPendientes).mockResolvedValue(PENDIENTES)
    renderSeccion()

    expect(await screen.findByRole("heading", { name: /Accesos pendientes del portal/ })).toBeTruthy()
    const fila = screen.getByText("Ana Ruiz").closest("tr") as HTMLElement
    expect(within(fila).getByText("ana@minera.pe")).toBeTruthy()
    expect(within(fila).getByText("Minera Sol S.A.C.")).toBeTruthy()
    expect(within(fila).getByText("20123456789")).toBeTruthy()
    expect(within(fila).getByText("Registro")).toBeTruthy()
    const filaGoogle = screen.getByText("Gina Paz").closest("tr") as HTMLElement
    expect(within(filaGoogle).getByText("Google")).toBeTruthy()
  })

  it("sin pendientes no muestra la sección", async () => {
    vi.mocked(listarAccesosPendientes).mockResolvedValue([])
    const { container } = renderSeccion()
    await vi.waitFor(() => expect(listarAccesosPendientes).toHaveBeenCalled())
    expect(container.querySelector("section")).toBeNull()
  })

  it("activar habilita el acceso y lo quita de la lista", async () => {
    vi.mocked(listarAccesosPendientes).mockResolvedValueOnce(PENDIENTES).mockResolvedValue([PENDIENTES[1]])
    vi.mocked(activarAccesoPendiente).mockResolvedValue(undefined)
    renderSeccion()

    const fila = (await screen.findByText("Ana Ruiz")).closest("tr") as HTMLElement
    fireEvent.click(within(fila).getByRole("button", { name: "Activar acceso de Ana Ruiz" }))

    await vi.waitFor(() => expect(activarAccesoPendiente).toHaveBeenCalledWith(7))
    expect(await screen.findByText(/Acceso de Ana Ruiz activado/)).toBeTruthy()
    await vi.waitFor(() => expect(screen.queryByText("ana@minera.pe")).toBeNull())
  })

  it("rechazar pide confirmación y luego rechaza", async () => {
    vi.mocked(listarAccesosPendientes).mockResolvedValueOnce(PENDIENTES).mockResolvedValue([PENDIENTES[0]])
    vi.mocked(rechazarAccesoPendiente).mockResolvedValue(undefined)
    renderSeccion()

    const fila = (await screen.findByText("Gina Paz")).closest("tr") as HTMLElement
    fireEvent.click(within(fila).getByRole("button", { name: "Rechazar acceso de Gina Paz" }))
    expect(rechazarAccesoPendiente).not.toHaveBeenCalled()
    fireEvent.click(await screen.findByRole("button", { name: "Rechazar acceso" }))

    await vi.waitFor(() => expect(rechazarAccesoPendiente).toHaveBeenCalledWith(8))
    expect(await screen.findByText(/Acceso de Gina Paz rechazado/)).toBeTruthy()
  })

  it("si falla al activar muestra el error y deja el acceso en la lista", async () => {
    vi.mocked(listarAccesosPendientes).mockResolvedValue(PENDIENTES)
    vi.mocked(activarAccesoPendiente).mockRejectedValue({ response: { status: 404, data: { message: "No hay un acceso pendiente con ese usuario" } } })
    renderSeccion()

    const fila = (await screen.findByText("Ana Ruiz")).closest("tr") as HTMLElement
    fireEvent.click(within(fila).getByRole("button", { name: "Activar acceso de Ana Ruiz" }))
    expect(await screen.findByText("No hay un acceso pendiente con ese usuario")).toBeTruthy()
    expect(screen.getByText("ana@minera.pe")).toBeTruthy()
  })

  it("resume cuántos hay por revisar y por qué vía llegaron", async () => {
    vi.mocked(listarAccesosPendientes).mockResolvedValue(PENDIENTES)
    renderSeccion()

    const resumen = await screen.findByRole("list", { name: "Resumen de accesos pendientes" })
    const valor = (etiqueta: string) => within(resumen).getByText(etiqueta).parentElement?.textContent
    expect(valor("Por revisar")).toContain("2")
    expect(valor("Con Google")).toContain("1")
    expect(valor("Con registro")).toContain("1")
  })

  it("muestra hace cuánto lo pidieron y las iniciales del contacto", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-11-21T12:30:00"))
    try {
      vi.mocked(listarAccesosPendientes).mockResolvedValue(PENDIENTES)
      renderSeccion()

      const fila = (await screen.findByText("Ana Ruiz")).closest("tr") as HTMLElement
      expect(within(fila).getByText("hace 2 h")).toBeTruthy()
      expect(within(fila).getByText("AR")).toBeTruthy()
      const filaGoogle = screen.getByText("Gina Paz").closest("tr") as HTMLElement
      expect(within(filaGoogle).getByText("hace 1 h")).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })
})
