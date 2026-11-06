import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it } from "vitest"
import { ProtectedRoute } from "./ProtectedRoute"
import { useAuthStore } from "@/features/auth/store/authStore"

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>ERP privado</div>} />
        </Route>
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.getState().logout()
  })

  it("rechaza una sesión de cliente aunque exista un token interno residual", () => {
    localStorage.setItem("access_token", "interno")
    localStorage.setItem("cliente_access_token", "cliente")
    useAuthStore.getState().login("interno", "usuario", "ADMINISTRADOR")
    renderGuard()
    expect(screen.getByText("Login")).toBeTruthy()
  })

  it("permite una sesión interna sin sesión de cliente", () => {
    localStorage.setItem("access_token", "interno")
    useAuthStore.getState().login("interno", "usuario", "ADMINISTRADOR")
    renderGuard()
    expect(screen.getByText("ERP privado")).toBeTruthy()
  })
})
