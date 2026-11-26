import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { BotonNuevaSolicitud } from "./BotonNuevaSolicitud"

describe("BotonNuevaSolicitud", () => {
  it("es un enlace a /portal/solicitud con el amarillo institucional de la landing", () => {
    render(<MemoryRouter><BotonNuevaSolicitud /></MemoryRouter>)
    const enlace = screen.getByRole("link", { name: "Nueva solicitud" })
    expect(enlace.getAttribute("href")).toBe("/portal/solicitud")
    expect(enlace.className).toContain("bg-[#FACC15]")
    expect(enlace.className).toContain("text-[#183153]")
  })

  it("la variante píldora es redonda, amarilla y lleva una flecha, sin cambiar su nombre accesible", () => {
    render(<MemoryRouter><BotonNuevaSolicitud variante="pildora" /></MemoryRouter>)
    const enlace = screen.getByRole("link", { name: "Nueva solicitud" })
    expect(enlace.className).toContain("rounded-full")
    expect(enlace.className).toContain("bg-[#FACC15]")
    expect(enlace.querySelector("svg")).toBeTruthy()
  })
})
