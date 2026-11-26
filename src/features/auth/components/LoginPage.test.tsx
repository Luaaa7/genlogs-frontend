import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { login } from "@/api/authApi"
import { LoginPage } from "./LoginPage"

vi.mock("@/api/authApi", () => ({ login: vi.fn() }))

function pintar(ruta = "/login") {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<p>Panel</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function ingresar() {
  fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "jefe" } })
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "clave-segura" } })
  fireEvent.click(screen.getByRole("button", { name: "Ingresar" }))
  await screen.findByText("Panel")
}

describe("LoginPage (panel interno)", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.mocked(login).mockReset()
  })
  afterEach(cleanup)

  describe("aviso de sesión vencida", () => {
    it("con ?motivo=sesion-expirada muestra «Tu sesión venció…»", () => {
      pintar("/login?motivo=sesion-expirada")
      expect(screen.getByText("Tu sesión venció. Inicia sesión nuevamente para continuar.")).toBeTruthy()
    })

    it("en un ingreso normal no lo muestra", () => {
      pintar("/login")
      expect(screen.queryByText(/tu sesión venció/i)).toBeNull()
    })
  })

  describe("refresh_token", () => {
    it("si el login trae refreshToken, lo guarda junto al access_token", async () => {
      vi.mocked(login).mockResolvedValue({ token: "acceso-1", refreshToken: "renovar-1", nombreUsuario: "jefe", nombreRol: "JEFE_ADMINISTRATIVO" })
      pintar()
      await ingresar()
      expect(localStorage.getItem("access_token")).toBe("acceso-1")
      expect(localStorage.getItem("refresh_token")).toBe("renovar-1")
    })

    it("también acepta refresh_token con guion bajo", async () => {
      vi.mocked(login).mockResolvedValue({ token: "acceso-2", refresh_token: "renovar-2", nombreUsuario: "jefe", nombreRol: "JEFE_ADMINISTRATIVO" })
      pintar()
      await ingresar()
      expect(localStorage.getItem("refresh_token")).toBe("renovar-2")
    })

    it("si el backend no lo devuelve, el ingreso sigue igual y no queda un refresh_token ajeno", async () => {
      localStorage.setItem("refresh_token", "de-otra-persona")
      vi.mocked(login).mockResolvedValue({ token: "acceso-3", nombreUsuario: "jefe", nombreRol: "JEFE_ADMINISTRATIVO" })
      pintar()
      await ingresar()
      expect(localStorage.getItem("access_token")).toBe("acceso-3")
      expect(localStorage.getItem("refresh_token")).toBeNull()
    })

    it("un refresh vacío no se guarda", async () => {
      vi.mocked(login).mockResolvedValue({ token: "acceso-4", refreshToken: "", nombreUsuario: "jefe", nombreRol: "JEFE_ADMINISTRATIVO" })
      pintar()
      await ingresar()
      await waitFor(() => expect(localStorage.getItem("refresh_token")).toBeNull())
    })
  })
})
