import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { BarraProgresoPortal } from "./BarraProgresoPortal"

describe("BarraProgresoPortal", () => {
  it("inactiva no pinta nada", () => {
    render(<BarraProgresoPortal activa={false} />)
    expect(screen.queryByRole("progressbar")).toBeNull()
  })

  it("activa es una línea de 2 px dorada (clara y oscura) pegada al borde inferior", () => {
    render(<div className="relative"><BarraProgresoPortal activa /></div>)
    const barra = screen.getByRole("progressbar", { name: "Cargando" })
    expect(barra.className).toContain("h-0.5")
    expect(barra.className).toContain("absolute")
    expect(barra.className).toContain("bottom-0")
    const relleno = barra.firstElementChild as HTMLElement
    expect(relleno.className).toContain("bg-[#B47B2B]")
    expect(relleno.className).toContain("dark:bg-[#FACC15]")
  })

  it("con movimiento reducido no se desliza: queda fija", () => {
    render(<BarraProgresoPortal activa />)
    const relleno = screen.getByRole("progressbar").firstElementChild as HTMLElement
    expect(relleno.className).toContain("motion-reduce:animate-none")
    expect(relleno.className).toContain("motion-reduce:w-full")
  })
})
