import { describe, expect, it } from "vitest"
import { Filter, Package, Plug, Wind } from "lucide-react"
import { TONOS, visualCategoria } from "./visualCategoria"

describe("visualCategoria", () => {
  it("elige el ícono por el nombre y, si no dice nada, por la categoría", () => {
    expect(visualCategoria("Componentes y Accesorios", "Adaptador - Linksys - PAP2T").Icono).toBe(Plug)
    expect(visualCategoria("Instrumentos", "Anemómetro Digital").Icono).toBe(Wind)
    expect(visualCategoria("Varios", "Pieza X").Icono).toBe(Package)
  })

  it("un filtro de aire es un filtro, no viento", () => {
    expect(visualCategoria("Filtros", "Filtro de aire").Icono).toBe(Filter)
  })

  it("el mismo producto siempre da el mismo color, y nunca verde ni naranja", () => {
    const a = visualCategoria("Filtros", "Filtro de aceite")
    expect(visualCategoria("Filtros", "Filtro de aceite").tono).toBe(a.tono)
    for (const tono of TONOS) {
      expect(tono).not.toMatch(/success|warning|chart-5|viz-3/)
    }
  })
})