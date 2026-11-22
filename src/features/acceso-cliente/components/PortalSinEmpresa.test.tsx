import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { MemoryRouter } from "react-router-dom"
import { PortalSinEmpresa } from "./PortalSinEmpresa"

function pintar(nombre?: string) {
  return render(<MemoryRouter><PortalSinEmpresa nombre={nombre} /></MemoryRouter>)
}

describe("PortalSinEmpresa", () => {
  it("saluda al cliente por su primer nombre", () => {
    pintar("Gina Paredes")
    expect(screen.getByText("Hola, Gina")).toBeTruthy()
  })

  it("sin nombre saluda sin inventar uno", () => {
    pintar("")
    expect(screen.getByText("Hola")).toBeTruthy()
  })

  it("dice que aún no tiene pedidos y lleva a pedir la primera cotización", () => {
    pintar("Gina")
    expect(screen.getByText("Aún no tienes pedidos")).toBeTruthy()
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Tu primera cotización está a unos minutos")
    expect(screen.getByRole("link", { name: /Pedir mi primera cotización/ }).getAttribute("href")).toBe("/portal/solicitud")
  })

  it("explica cómo funciona en tres pasos, con el plazo de 1 a 5 días hábiles", () => {
    pintar("Gina")
    const pasos = screen.getByRole("list", { name: "Cómo funciona" })
    const items = within(pasos).getAllByRole("listitem")
    expect(items).toHaveLength(3)
    expect(items.map((i) => i.querySelector("h3")?.textContent)).toEqual([
      "Pide tu cotización",
      "La preparamos",
      "Recibe y sigue tu pedido",
    ])
    expect(items[1].textContent).toContain("1 a 5 días hábiles")
  })

  it("la vista previa del pedido es decorativa: los lectores de pantalla no la leen", () => {
    const { container } = pintar("Gina")
    const vista = container.querySelector("[data-vista-previa]")
    expect(vista).not.toBeNull()
    expect(vista?.getAttribute("aria-hidden")).toBe("true")
  })
})
