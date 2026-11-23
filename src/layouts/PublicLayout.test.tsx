import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import { PublicLayout } from "./PublicLayout"

vi.mock("@/hooks/useTheme", () => ({ useTheme: () => ({ tema: "light", alternarTema: () => {} }) }))

describe("Cabecera pública", () => {
  it("«Portal de clientes» lleva al ingreso del cliente, no al registro (PS4)", () => {
    render(<MemoryRouter><PublicLayout /></MemoryRouter>)
    expect(screen.getByRole("link", { name: "Portal de clientes" }).getAttribute("href")).toBe("/portal/ingreso")
  })

  it("tiene «Pedir cotización», Catálogo y Contacto", () => {
    render(<MemoryRouter><PublicLayout /></MemoryRouter>)
    expect(screen.getByRole("link", { name: /Pedir cotización/ }).getAttribute("href")).toContain("#solicitud")
    expect(screen.getByRole("link", { name: "Catálogo" }).getAttribute("href")).toContain("#catalogo")
    expect(screen.getByRole("link", { name: "Contacto" })).toBeTruthy()
  })

  it("fuera de la landing los enlaces apuntan a /#catalogo y /#solicitud", () => {
    render(<MemoryRouter initialEntries={["/portal/ingreso"]}><PublicLayout /></MemoryRouter>)
    expect(screen.getByRole("link", { name: "Catálogo" }).getAttribute("href")).toBe("/#catalogo")
    expect(screen.getByRole("link", { name: /Pedir cotización/ }).getAttribute("href")).toBe("/#solicitud")
  })

  it("el botón «Pedir cotización» de la cabecera se esconde en celular (hidden sm:flex)", () => {
    render(<MemoryRouter><PublicLayout /></MemoryRouter>)
    const clases = screen.getByRole("link", { name: /Pedir cotización/ }).className.split(" ")
    expect(clases).toContain("hidden")
    expect(clases).toContain("sm:flex")
  })
})
