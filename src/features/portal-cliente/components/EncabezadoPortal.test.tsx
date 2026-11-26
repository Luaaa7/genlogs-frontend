import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { EncabezadoPortal } from "./EncabezadoPortal"

describe("EncabezadoPortal", () => {
  it("muestra la etiqueta dorada, el título y la descripción", () => {
    render(<EncabezadoPortal titulo="Mi perfil" descripcion="Tus datos." />)
    expect(screen.getByText("Portal del cliente")).toBeTruthy()
    expect(screen.getByRole("heading", { level: 1, name: "Mi perfil" })).toBeTruthy()
    expect(screen.getByText("Tus datos.")).toBeTruthy()
  })

  it("pone la acción a la derecha cuando la hay", () => {
    render(<EncabezadoPortal titulo="Mis pedidos" accion={<button type="button">Acción</button>} />)
    expect(screen.getByRole("button", { name: "Acción" })).toBeTruthy()
  })
})
