import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ResetPasswordPage } from "./ResetPasswordPage"
import { restablecerPassword, validarTokenReset } from "@/api/authApi"

vi.mock("@/api/authApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/api/authApi")>()
  return { ...original, validarTokenReset: vi.fn(), restablecerPassword: vi.fn() }
})

function abrir(ruta = "/reset-password?token=abc") {
  return render(<MemoryRouter initialEntries={[ruta]}><ResetPasswordPage /></MemoryRouter>)
}

async function cambiarContrasena() {
  await screen.findByRole("heading", { name: "Nueva contraseña" })
  fireEvent.change(screen.getByLabelText("Contraseña nueva"), { target: { value: "NuevaClave123" } })
  fireEvent.change(screen.getByLabelText("Confirmar contraseña"), { target: { value: "NuevaClave123" } })
  fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }))
  return screen.findByRole("link", { name: "Ir al login" })
}

describe("ResetPasswordPage (v3.4)", () => {
  beforeEach(() => {
    vi.mocked(validarTokenReset).mockReset()
    vi.mocked(restablecerPassword).mockReset().mockResolvedValue(undefined)
  })

  it("un cliente vuelve al ingreso del portal", async () => {
    vi.mocked(validarTokenReset).mockResolvedValue({ segundosRestantes: 900, portal: true })
    abrir()
    expect((await cambiarContrasena()).getAttribute("href")).toBe("/portal/ingreso")
  })

  it("el personal vuelve a su login", async () => {
    vi.mocked(validarTokenReset).mockResolvedValue({ segundosRestantes: 900, portal: false })
    abrir()
    expect((await cambiarContrasena()).getAttribute("href")).toBe("/login")
  })

  it("si el backend todavía no manda «portal», sigue yendo al login del personal", async () => {
    vi.mocked(validarTokenReset).mockResolvedValue({ segundosRestantes: 900 })
    abrir()
    expect((await cambiarContrasena()).getAttribute("href")).toBe("/login")
  })

  it("el enlace no disponible dice 15 minutos, como el backend y el correo", async () => {
    vi.mocked(validarTokenReset).mockRejectedValue(new Error("vencido"))
    abrir()
    expect(await screen.findByText(/Los enlaces duran 15 minutos/)).toBeTruthy()
    expect(screen.getByRole("link", { name: "¿Eres cliente? Ingresa al portal" }).getAttribute("href")).toBe("/portal/ingreso")
  })
})
