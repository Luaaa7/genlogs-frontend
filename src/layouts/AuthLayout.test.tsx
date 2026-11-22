import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import { AuthLayout } from "./AuthLayout"

vi.mock("@/hooks/useTheme", () => ({ useTheme: () => ({ tema: "light", alternarTema: () => {} }) }))

function renderEn(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<div>Formulario de ingreso</div>} />
          <Route path="/recuperar-password" element={<div>Formulario de recuperación</div>} />
          <Route path="/reset-password" element={<div>Formulario de nueva contraseña</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe("Panel de marca en las pantallas de ingreso (v3.4, K3)", () => {
  it.each([
    ["/login", "Formulario de ingreso"],
    ["/recuperar-password", "Formulario de recuperación"],
    ["/reset-password", "Formulario de nueva contraseña"],
  ])("%s muestra el panel de marca junto al formulario", (ruta, formulario) => {
    renderEn(ruta)
    expect(screen.getByRole("complementary", { name: "GenLogs S.A.C." })).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Repuestos y servicios para la minería" })).toBeTruthy()
    expect(screen.getByText("Acceso por rol")).toBeTruthy()
    expect(screen.getByText(formulario)).toBeTruthy()
  })

  it("el panel se oculta en el celular y el logo del formulario en pantalla grande", () => {
    renderEn("/login")
    expect(screen.getByRole("complementary", { name: "GenLogs S.A.C." }).className).toContain("hidden lg:flex")
    expect(screen.getByRole("link", { name: "GenLogs S.A.C." }).className).toContain("lg:hidden")
  })
})
