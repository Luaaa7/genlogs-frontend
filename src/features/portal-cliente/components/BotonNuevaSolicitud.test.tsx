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

  it.each([["normal"], ["pildora"]] as const)("la variante %s se eleva al pasar el cursor y su flecha se desplaza", (variante) => {
    render(<MemoryRouter><BotonNuevaSolicitud variante={variante} /></MemoryRouter>)
    const enlace = screen.getByRole("link", { name: "Nueva solicitud" })
    for (const clase of ["group", "hover:-translate-y-0.5", "hover:shadow-md", "transition-all", "motion-reduce:hover:translate-y-0"]) {
      expect(enlace.className).toContain(clase)
    }
    const flecha = enlace.querySelector("svg") as SVGElement
    expect(flecha.getAttribute("class")).toContain("group-hover:translate-x-1")
    expect(flecha.getAttribute("class")).toContain("motion-reduce:transition-none")
    expect(flecha.getAttribute("aria-hidden")).toBe("true")
  })
})
