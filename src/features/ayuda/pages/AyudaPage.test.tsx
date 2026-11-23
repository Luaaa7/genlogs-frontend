import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { AyudaPage } from "./AyudaPage"

describe("Ayuda (v3.4, K2)", () => {
  it("tiene la guía para clientes y para el personal", () => {
    render(<MemoryRouter><AyudaPage /></MemoryRouter>)
    expect(screen.getByRole("heading", { name: /Para clientes/ })).toBeTruthy()
    expect(screen.getByRole("heading", { name: /Para el personal de GENLOGS/ })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Ingresar al portal" }).getAttribute("href")).toBe("/portal/ingreso")
    expect(screen.getByRole("link", { name: "Acceso del personal" }).getAttribute("href")).toBe("/login")
  })

  it("muestra las preguntas frecuentes y el enlace a Contáctame", () => {
    render(<MemoryRouter><AyudaPage /></MemoryRouter>)
    expect(screen.getByRole("heading", { name: "Preguntas frecuentes" })).toBeTruthy()
    expect(screen.getByText("¿Cuánto tiempo vale una cotización?")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Contáctame" }).getAttribute("href")).toBe("/contacto")
  })
})
