import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { AvisoSesionVencida } from "./AvisoSesionVencida"

const pintar = (ruta: string) => render(<MemoryRouter initialEntries={[ruta]}><AvisoSesionVencida /></MemoryRouter>)

describe("AvisoSesionVencida", () => {
  it("con ?motivo=sesion-expirada muestra el aviso", () => {
    pintar("/login?motivo=sesion-expirada")
    expect(screen.getByRole("status").textContent).toBe("Tu sesión venció. Inicia sesión nuevamente para continuar.")
  })

  it("convive con ?volver= en el ingreso del cliente", () => {
    pintar("/portal/ingreso?volver=%2Fportal%2Fpedidos&motivo=sesion-expirada")
    expect(screen.getByRole("status")).toBeTruthy()
  })

  it.each(["/login", "/login?motivo=otro", "/login?volver=%2Fx"])("en %s no muestra nada", (ruta) => {
    pintar(ruta)
    expect(screen.queryByRole("status")).toBeNull()
  })
})
