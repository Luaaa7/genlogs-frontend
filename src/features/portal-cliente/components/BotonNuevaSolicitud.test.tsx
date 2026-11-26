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
})
