import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ListaEsqueleto, SkeletonCard } from "./SkeletonCard"

describe("SkeletonCard", () => {
  it("usa los colores de tarjeta del portal en claro y oscuro", () => {
    render(<SkeletonCard variante="pedido" />)
    const tarjeta = screen.getByTestId("skeleton-card")
    for (const clase of ["bg-white", "dark:bg-slate-900", "border-slate-200", "dark:border-slate-800"]) {
      expect(tarjeta.className).toContain(clase)
    }
    expect(tarjeta.getAttribute("aria-hidden")).toBe("true")
  })

  it("las piezas fantasma laten y se quedan quietas con movimiento reducido", () => {
    render(<SkeletonCard variante="pedido" />)
    const piezas = screen.getByTestId("skeleton-card").querySelectorAll("[data-parte]")
    expect(piezas.length).toBeGreaterThan(0)
    for (const pieza of piezas) {
      expect(pieza.className).toContain("animate-pulse")
      expect(pieza.className).toContain("motion-reduce:animate-none")
    }
  })

  it.each([
    ["pedido", ["codigo", "titulo", "insignia", "progreso"]],
    ["cotizacion", ["codigo", "titulo", "insignia"]],
    ["comprobante", ["codigo", "titulo", "insignia"]],
    ["despacho", ["codigo", "titulo"]],
    ["repuesto", ["imagen", "titulo"]],
  ] as const)("la silueta de «%s» incluye sus piezas", (variante, partes) => {
    render(<SkeletonCard variante={variante} />)
    const tarjeta = screen.getByTestId("skeleton-card")
    for (const parte of partes) expect(tarjeta.querySelector(`[data-parte="${parte}"]`)).not.toBeNull()
  })

  it("solo el pedido lleva barra de progreso fantasma", () => {
    render(<SkeletonCard variante="cotizacion" />)
    expect(screen.getByTestId("skeleton-card").querySelector('[data-parte="progreso"]')).toBeNull()
  })
})

describe("ListaEsqueleto", () => {
  it("muestra 3 tarjetas por defecto dentro de una región que avisa que carga", () => {
    render(<ListaEsqueleto variante="cotizacion" etiqueta="Cargando cotizaciones..." />)
    const region = screen.getByRole("status")
    expect(region.getAttribute("aria-busy")).toBe("true")
    expect(within(region).getByText("Cargando cotizaciones...").className).toContain("sr-only")
    expect(screen.getAllByTestId("skeleton-card")).toHaveLength(3)
  })

  it("acepta otra cantidad", () => {
    render(<ListaEsqueleto variante="despacho" etiqueta="Cargando despachos..." cantidad={2} />)
    expect(screen.getAllByTestId("skeleton-card")).toHaveLength(2)
  })

  it("la silueta de repuestos se acomoda en la misma grilla que las tarjetas reales", () => {
    render(<ListaEsqueleto variante="repuesto" etiqueta="Cargando repuestos..." />)
    expect(screen.getByRole("status").className).toContain("grid")
    expect(screen.getByRole("status").className).toContain("sm:grid-cols-2")
  })
})
