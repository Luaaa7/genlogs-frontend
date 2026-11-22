import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import { PublicLayout } from "./PublicLayout"

vi.mock("@/hooks/useTheme", () => ({ useTheme: () => ({ tema: "light", alternarTema: () => {} }) }))

describe("Barra de la landing", () => {
  it("«Ingresar» lleva al ingreso del cliente, no al registro (PS4)", () => {
    render(<MemoryRouter><PublicLayout /></MemoryRouter>)
    expect(screen.getByRole("link", { name: "Ingresar" }).getAttribute("href")).toBe("/portal/ingreso")
  })

  it("la cabecera y el pie llevan a Ayuda y Contáctame (v3.4, K2)", () => {
    render(<MemoryRouter><PublicLayout /></MemoryRouter>)
    expect(screen.getByRole("link", { name: "Contacto" }).getAttribute("href")).toBe("/contacto")
    expect(screen.getByRole("link", { name: "Contáctame" }).getAttribute("href")).toBe("/contacto")
    expect(screen.getAllByRole("link", { name: "Ayuda" }).map((a) => a.getAttribute("href"))).toEqual(["/ayuda", "/ayuda"])
  })
})