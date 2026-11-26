import { describe, expect, it } from "vitest"
import type { RepuestoPortal } from "../repuestosApi"
import { inicialesMarca, logoDeMarca, partesNombre, resumirMarcas, slugMarca, tonoMarca } from "./marcas"

const base: RepuestoPortal = {
  idProducto: 1, nombre: "Filtro", descripcion: null, marca: "SKF", numeroParte: null, idCategoria: 1, categoria: "Filtros",
  unidad: null, tipoRepuesto: "OEM", plazoEntrega: "24 h", urlImagen: null, precioReferencial: null, moneda: "PEN",
}

describe("marcas del portal", () => {
  it("arma el slug del archivo de logo sin tildes ni símbolos", () => {
    expect(slugMarca("Endress+Hauser")).toBe("endress-hauser")
    expect(slugMarca("  Compañía Ñandú ")).toBe("compania-nandu")
  })

  it("monograma de respaldo", () => {
    expect(inicialesMarca("ABB")).toBe("ABB")
    expect(inicialesMarca("AT&T")).toBe("AT&T")
    expect(inicialesMarca("Allen-Bradley")).toBe("AB")
    expect(inicialesMarca("Donaldson")).toBe("DO")
    expect(inicialesMarca("")).toBe("?")
  })

  it("el tono es estable para la misma marca", () => {
    expect(tonoMarca("Fluke")).toBe(tonoMarca("fluke"))
  })

  it("asocia el logotipo por el nombre de la marca, y sin archivo usa el respaldo", () => {
    expect(logoDeMarca("Allen-Bradley")).toBeTruthy()
    expect(logoDeMarca("AT&T")).toBe(logoDeMarca("at-t"))
    expect(logoDeMarca("AT&T")).toBeTruthy()
    expect(logoDeMarca("Marca que no existe")).toBeUndefined()
  })

  it("separa tipo y N.º de parte del nombre del catálogo, sin tocar los nombres libres", () => {
    expect(partesNombre({ nombre: "Fusible - Bussmann - FRN-R-20", marca: "Bussmann", numeroParte: null })).toEqual({ titulo: "Fusible", numeroParte: "FRN-R-20" })
    expect(partesNombre({ nombre: "Filtro de combustible", marca: "CAT", numeroParte: "1R-0750" })).toEqual({ titulo: "Filtro de combustible", numeroParte: "1R-0750" })
    expect(partesNombre({ nombre: "Uno - Otra - X", marca: "CAT", numeroParte: null })).toEqual({ titulo: "Uno - Otra - X", numeroParte: null })
  })

  it("resume todas las marcas en orden y cuenta según la categoría", () => {
    const lista = [
      { ...base, idProducto: 1, marca: "SKF", idCategoria: 1 },
      { ...base, idProducto: 2, marca: "ABB", idCategoria: 2 },
      { ...base, idProducto: 3, marca: "SKF", idCategoria: 2 },
      { ...base, idProducto: 4, marca: null, idCategoria: 2 },
    ]
    expect(resumirMarcas(lista)).toEqual([{ marca: "ABB", n: 1, total: 1 }, { marca: "SKF", n: 2, total: 2 }])
    expect(resumirMarcas(lista, "1")).toEqual([{ marca: "ABB", n: 0, total: 1 }, { marca: "SKF", n: 1, total: 2 }])
    expect(resumirMarcas(lista, undefined, "repuestos").map((m) => m.marca)).toEqual(["SKF", "ABB"])
  })
})
