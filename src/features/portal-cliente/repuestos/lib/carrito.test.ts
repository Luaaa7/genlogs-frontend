import { beforeEach, describe, expect, it } from "vitest"
import { agregar, estimado, faltaIdentificar, guardarCarrito, leerCarrito, MAX_ITEMS, type ItemCarrito } from "./carrito"

const item = (clave: string, precio?: number, cantidad = 1): ItemCarrito => ({ clave, descripcion: `Repuesto ${clave}`, precio, cantidad })

describe("carrito de cotización", () => {
  beforeEach(() => localStorage.clear())

  it("suma la cantidad si el repuesto ya estaba", () => {
    const c = agregar(agregar([], item("1", 10)), item("1", 10, 2))
    expect(c).toHaveLength(1)
    expect(c[0].cantidad).toBe(3)
  })

  it("no pasa de 50 repuestos", () => {
    let c: ItemCarrito[] = []
    for (let i = 0; i < MAX_ITEMS + 5; i++) c = agregar(c, item(String(i)))
    expect(c).toHaveLength(MAX_ITEMS)
  })

  it("el total referencial solo se muestra si todos tienen precio", () => {
    expect(estimado([item("1", 10.5, 2), item("2", 4)])).toBe(25)
    expect(estimado([item("1", 10), item("texto:x")])).toBeNull()
    expect(estimado([])).toBeNull()
  })

  it("se guarda en el navegador y descarta datos dañados", () => {
    guardarCarrito([item("1", 10)])
    expect(leerCarrito()).toHaveLength(1)
    localStorage.setItem("genlogs-carrito-repuestos", "{dañado")
    expect(leerCarrito()).toEqual([])
    guardarCarrito([])
    expect(localStorage.getItem("genlogs-carrito-repuestos")).toBeNull()
  })

  it("un repuesto fuera de la vitrina pide N.º de parte con marca, o foto (D-01)", () => {
    expect(faltaIdentificar({ ...item("v"), idProducto: 7 })).toBeNull()
    expect(faltaIdentificar(item("a"))).toMatch(/n\.º de parte y la marca, o adjunta/i)
    expect(faltaIdentificar({ ...item("b"), numeroParte: "PD-200" })).toMatch(/marca/i)
    expect(faltaIdentificar({ ...item("c"), numeroParte: " ", marca: "Hardox" })).not.toBeNull()
    expect(faltaIdentificar({ ...item("d"), numeroParte: "PD-200", marca: "Hardox" })).toBeNull()
    expect(faltaIdentificar({ ...item("e"), urlFoto: "/uploads/x.jpg" })).toBeNull()
  })
})
