import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { restablecerPassword, validarTokenReset } from "@/api/authApi"
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

/** El backend dice si la cuenta del enlace es de un cliente del portal. */
const enlaceDe = (portal: boolean) => vi.mocked(validarTokenReset).mockResolvedValue({ segundosRestantes: 1500, portal })

describe("ResetPasswordPage: a dónde vuelve cada persona", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(restablecerPassword).mockResolvedValue(undefined)
  })

  it("una cuenta del personal termina en /login", async () => {
    enlaceDe(false)
    renderPagina()
    await cambiarContrasena()

    const ir = await screen.findByRole("link", { name: "Ir al login" })
    expect(ir.getAttribute("href")).toBe("/login")
  })

  it("una cuenta de cliente termina en /portal/ingreso, aunque abra el enlace en otro dispositivo", async () => {
    enlaceDe(true) // sin nada guardado en este navegador y sin ?origen en el enlace
    renderPagina()
    await cambiarContrasena()

    const ir = await screen.findByRole("link", { name: "Ir a ingresar" })
    expect(ir.getAttribute("href")).toBe("/portal/ingreso")
    expect(screen.queryByRole("link", { name: "Ir al login" })).toBeNull()
  })

  it("lo que diga el servidor manda: un valor viejo en el navegador no cambia nada", async () => {
    localStorage.setItem("genlogs-origen-recuperacion", "portal")
    enlaceDe(false)
    renderPagina("/reset-password?token=abc&origen=portal")
    await cambiarContrasena()

    expect((await screen.findByRole("link", { name: "Ir al login" })).getAttribute("href")).toBe("/login")
  })

  it("con un enlace vencido no se sabe quién es: vuelve al login y pide otro enlace normal", async () => {
    vi.mocked(validarTokenReset).mockRejectedValue(new Error("vencido"))
    renderPagina()

    await waitFor(() => expect(screen.getByText("Enlace no disponible")).toBeTruthy())
    expect(screen.getByRole("link", { name: "Solicitar un enlace nuevo" }).getAttribute("href")).toBe("/recuperar-password")
    expect(screen.getByRole("link", { name: "Volver al inicio de sesión" }).getAttribute("href")).toBe("/login")
  })

  it("si el enlace se vence mientras la cuenta es de un cliente, el aviso lo manda a ingresar", async () => {
    enlaceDe(true)
    vi.mocked(restablecerPassword).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "El enlace venció o ya fue utilizado." } },
    })
    renderPagina()
    await cambiarContrasena()

    await waitFor(() => expect(screen.getByText("Enlace no disponible")).toBeTruthy())
    expect(screen.getByRole("link", { name: "Solicitar un enlace nuevo" }).getAttribute("href")).toBe(
      "/recuperar-password?origen=portal",
    )
    expect(screen.getByRole("link", { name: "Volver a ingresar" }).getAttribute("href")).toBe("/portal/ingreso")
  })
})
