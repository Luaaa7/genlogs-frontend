import { describe, expect, it } from "vitest"
import { marcasPorCantidad, paginasVisibles, TAM_PAGINA } from "./catalogo"

describe("marcasPorCantidad", () => {
  it("ordena de mayor a menor cantidad de repuestos, y a igualdad, por nombre", () => {
    const marcas = marcasPorCantidad([{ marca: "SKF" }, { marca: "CAT" }, { marca: "CAT" }, { marca: "ABB" }, { marca: null }, { marca: "" }])
    expect(marcas).toEqual([{ marca: "CAT", n: 2 }, { marca: "ABB", n: 1 }, { marca: "SKF", n: 1 }])
  })
})

describe("paginasVisibles", () => {
  it("pocas páginas: todas", () => {
    expect(paginasVisibles(1, 4)).toEqual([1, 2, 3, 4])
  })
  it("muchas páginas: primera, última y las vecinas de la actual, con «…» en los saltos", () => {
    expect(paginasVisibles(1, 20)).toEqual([1, 2, "…", 20])
    expect(paginasVisibles(10, 20)).toEqual([1, "…", 9, 10, 11, "…", 20])
    expect(paginasVisibles(20, 20)).toEqual([1, "…", 19, 20])
  })
  it("son 12 tarjetas por página", () => {
    expect(TAM_PAGINA).toBe(12)
  })
})
