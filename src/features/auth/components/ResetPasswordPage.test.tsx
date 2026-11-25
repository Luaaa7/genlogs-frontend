import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { restablecerPassword, validarTokenReset } from "@/api/authApi"
import { CLAVE_ORIGEN } from "../lib/origenRecuperacion"
import { ResetPasswordPage } from "./ResetPasswordPage"

vi.mock("@/api/authApi", () => ({ restablecerPassword: vi.fn(), validarTokenReset: vi.fn() }))

function renderPagina(ruta = "/reset-password?token=abc") {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ResetPasswordPage />
    </MemoryRouter>,
  )
}

async function cambiarContrasena() {
  fireEvent.change(await screen.findByLabelText("Contraseña nueva"), { target: { value: "ClaveNueva123" } })
  fireEvent.change(screen.getByLabelText("Confirmar contraseña"), { target: { value: "ClaveNueva123" } })
  fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }))
}

describe("ResetPasswordPage: a dónde vuelve cada persona", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(validarTokenReset).mockResolvedValue({ segundosRestantes: 1500 })
    vi.mocked(restablecerPassword).mockResolvedValue(undefined)
  })

  it("el personal termina en /login", async () => {
    renderPagina()
    await cambiarContrasena()

    const ir = await screen.findByRole("link", { name: "Ir al login" })
    expect(ir.getAttribute("href")).toBe("/login")
  })

  it("el cliente que empezó en el portal termina en /portal/ingreso", async () => {
    localStorage.setItem(CLAVE_ORIGEN, "portal")
    renderPagina()
    await cambiarContrasena()

    const ir = await screen.findByRole("link", { name: "Ir a ingresar" })
    expect(ir.getAttribute("href")).toBe("/portal/ingreso")
    expect(screen.queryByRole("link", { name: "Ir al login" })).toBeNull()
  })

  it("también acepta el origen en el propio enlace", async () => {
    renderPagina("/reset-password?token=abc&origen=portal")
    await cambiarContrasena()

    expect((await screen.findByRole("link", { name: "Ir a ingresar" })).getAttribute("href")).toBe("/portal/ingreso")
  })

  it("al volver a ingresar, el origen recordado se borra", async () => {
    localStorage.setItem(CLAVE_ORIGEN, "portal")
    renderPagina()
    await cambiarContrasena()

    fireEvent.click(await screen.findByRole("link", { name: "Ir a ingresar" }))

    expect(localStorage.getItem(CLAVE_ORIGEN)).toBeNull()
  })

  it("con un enlace vencido, el cliente puede pedir otro sin perder su origen", async () => {
    localStorage.setItem(CLAVE_ORIGEN, "portal")
    vi.mocked(validarTokenReset).mockRejectedValue(new Error("vencido"))
    renderPagina()

    await waitFor(() => expect(screen.getByText("Enlace no disponible")).toBeTruthy())
    expect(screen.getByRole("link", { name: "Solicitar un enlace nuevo" }).getAttribute("href")).toBe(
      "/recuperar-password?origen=portal",
    )
    expect(screen.getByRole("link", { name: "Volver a ingresar" }).getAttribute("href")).toBe("/portal/ingreso")
  })

  it("con un enlace vencido, el personal sigue con /login", async () => {
    vi.mocked(validarTokenReset).mockRejectedValue(new Error("vencido"))
    renderPagina()

    await waitFor(() => expect(screen.getByText("Enlace no disponible")).toBeTruthy())
    expect(screen.getByRole("link", { name: "Solicitar un enlace nuevo" }).getAttribute("href")).toBe("/recuperar-password")
    expect(screen.getByRole("link", { name: "Volver al inicio de sesión" }).getAttribute("href")).toBe("/login")
  })
})
