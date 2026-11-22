import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { DashboardCard, SinDatos } from "./DashboardCard"

describe("DashboardCard", () => {
  it("muestra el ícono del bloque según su id", () => {
    const { container } = render(<DashboardCard id="dash-estados" titulo="Cotizaciones por estado">contenido</DashboardCard>)
    expect(container.querySelector('[data-icono="dash-estados"]')).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Cotizaciones por estado" })).toBeTruthy()
  })

  it("un id sin ícono asignado se ve sin ícono", () => {
    const { container } = render(<DashboardCard id="dash-otro" titulo="Otro bloque">contenido</DashboardCard>)
    expect(container.querySelector("[data-icono]")).toBeNull()
    expect(screen.getByText("contenido")).toBeTruthy()
  })
})

describe("SinDatos", () => {
  it("muestra el mensaje y, si hay acción, el enlace para empezar", () => {
    render(
      <MemoryRouter>
        <SinDatos accion={{ label: "Crear la primera cotización", href: "/cotizaciones/nueva" }}>Sin cotizaciones registradas.</SinDatos>
      </MemoryRouter>,
    )
    expect(screen.getByText("Sin cotizaciones registradas.")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Crear la primera cotización" }).getAttribute("href")).toBe("/cotizaciones/nueva")
  })

  it("sin acción no muestra enlace", () => {
    render(<SinDatos>Sin montos en los últimos meses.</SinDatos>)
    expect(screen.getByText("Sin montos en los últimos meses.")).toBeTruthy()
    expect(screen.queryByRole("link")).toBeNull()
  })
})