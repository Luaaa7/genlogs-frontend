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

  it("tiene «Pedir cotización», Catálogo y Contáctame", () => {
    render(<MemoryRouter><PublicLayout /></MemoryRouter>)
    expect(screen.getByRole("link", { name: /Pedir cotización/ }).getAttribute("href")).toContain("#solicitud")
    expect(screen.getByRole("link", { name: "Catálogo" }).getAttribute("href")).toContain("#catalogo")
    expect(screen.getAllByRole("link", { name: "Contáctame" }).length).toBeGreaterThan(0)
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

  it("la cabecera y el pie llevan a Ayuda y Contáctame (v3.4, K2)", () => {
    render(<MemoryRouter><PublicLayout /></MemoryRouter>)
    // El mismo nombre en la cabecera y en el pie (portal y menú interno también dicen «Contáctame»).
    expect(screen.getAllByRole("link", { name: "Contáctame" }).map((a) => a.getAttribute("href"))).toEqual(["/contacto", "/contacto"])
    expect(screen.queryByRole("link", { name: "Contacto" })).toBeNull()
    expect(screen.getAllByRole("link", { name: "Ayuda" }).map((a) => a.getAttribute("href"))).toEqual(["/ayuda", "/ayuda"])
  })

  it("el pie lleva al ingreso del personal (/login) para quien usa la app o la web", () => {
    render(<MemoryRouter><PublicLayout /></MemoryRouter>)
    expect(screen.getByRole("link", { name: "Ingreso del personal" }).getAttribute("href")).toBe("/login")
  })
})
