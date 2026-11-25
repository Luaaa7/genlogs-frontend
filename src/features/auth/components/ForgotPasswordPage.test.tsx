import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { solicitarRecuperacion } from "@/api/authApi"
import { ForgotPasswordPage } from "./ForgotPasswordPage"

vi.mock("@/api/authApi", () => ({ solicitarRecuperacion: vi.fn() }))

function renderPagina(ruta = "/recuperar-password") {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ForgotPasswordPage />
    </MemoryRouter>,
  )
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("desde el login del personal vuelve a /login", () => {
    renderPagina()
    expect(screen.getByRole("link", { name: "Volver al inicio de sesión" }).getAttribute("href")).toBe("/login")
  })

  it("desde el portal del cliente vuelve a /portal/ingreso", () => {
    renderPagina("/recuperar-password?origen=portal")
    expect(screen.getByRole("link", { name: "Volver a ingresar" }).getAttribute("href")).toBe("/portal/ingreso")
    expect(screen.queryByRole("link", { name: "Volver al inicio de sesión" })).toBeNull()
  })

  it("pide el enlace con el correo escrito y avisa sin revelar si existe", async () => {
    vi.mocked(solicitarRecuperacion).mockResolvedValue(undefined)
    renderPagina("/recuperar-password?origen=portal")

    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "cliente@prueba.pe" } })
    fireEvent.click(screen.getByRole("button", { name: "Enviar enlace" }))

    await waitFor(() => expect(solicitarRecuperacion).toHaveBeenCalledWith("cliente@prueba.pe"))
    expect(await screen.findByText(/si el correo está registrado/i)).toBeTruthy()
    expect(screen.getByRole("link", { name: "Volver a ingresar" })).toBeTruthy()
  })
})
