import { beforeEach, describe, expect, it } from "vitest"
import {
  CLAVE_BORRADOR,
  guardarBorrador,
  itemsDesdePrecargados,
  leerBorrador,
  limpiarBorrador,
  type BorradorSolicitud,
} from "./borradorSolicitud"
import { itemVacio } from "./itemPedido"

const borrador: BorradorSolicitud = {
  asunto: "Filtros",
  asuntoEditado: true,
  detalle: "Para el cargador",
  notaAbierta: true,
  items: [{ modo: "foto", descripcion: "Pieza", cantidad: "2", unidad: "UND", marca: "", numeroParte: "", gtin: "", urlFoto: null }],
  teniaAdjunto: true,
  precargados: 0,
  claveNavegacion: "k1",
}

describe("borrador en sessionStorage", () => {
  beforeEach(() => sessionStorage.clear())

  it("guarda y lee el borrador", () => {
    guardarBorrador(borrador)
    expect(leerBorrador()).toEqual(borrador)
  })

  it("conserva el modo «servicio» del repuesto y cualquier otro valor cae en «parte»", () => {
    const items = [
      { ...borrador.items[0], modo: "servicio" },
      { ...borrador.items[0], modo: "otra-cosa" },
    ]
    sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ ...borrador, items }))
    expect(leerBorrador()?.items.map((i) => i.modo)).toEqual(["servicio", "parte"])
  })

  it("limpiarBorrador borra la clave", () => {
    guardarBorrador(borrador)
    limpiarBorrador()
    expect(sessionStorage.getItem(CLAVE_BORRADOR)).toBeNull()
    expect(leerBorrador()).toBeNull()
  })

  it("ignora un borrador que no es JSON o que no tiene la forma esperada", () => {
    sessionStorage.setItem(CLAVE_BORRADOR, "no es json")
    expect(leerBorrador()).toBeNull()
    sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ asunto: 5, items: "x" }))
    expect(leerBorrador()).toBeNull()
  })

  it("descarta los repuestos mal formados (la página arranca con uno vacío)", () => {
    sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify({ ...borrador, items: [null, 3, "x"] }))
    expect(leerBorrador()?.items).toEqual([])
  })
})

describe("itemsDesdePrecargados", () => {
  it("elige el modo según traiga N.º de parte o no", () => {
    const items = itemsDesdePrecargados([
      { descripcion: "Filtro", marca: "Caterpillar", numeroParte: "1R-0750", cantidad: 3, unidad: "UND" },
      { descripcion: "Pieza sin código", cantidad: 1 },
    ])
    expect(items.map((i) => i.modo)).toEqual(["parte", "foto"])
    expect(items[0]).toMatchObject({ descripcion: "Filtro", marca: "Caterpillar", numeroParte: "1R-0750", cantidad: "3", unidad: "UND" })
    expect(items[1]).toMatchObject({ descripcion: "Pieza sin código", cantidad: "1", numeroParte: "" })
  })

  it("conserva la foto ya subida y el producto de la vitrina", () => {
    const [item] = itemsDesdePrecargados([{ descripcion: "Pieza", cantidad: 1, urlFoto: "https://res.cloudinary.com/x/p.jpg", idProducto: 7 }])
    expect(item.urlFoto).toBe("https://res.cloudinary.com/x/p.jpg")
    expect(item.idProducto).toBe(7)
  })

  it("cada repuesto trae su propio id para React", () => {
    const [a, b] = itemsDesdePrecargados([{ descripcion: "A", cantidad: 1 }, { descripcion: "B", cantidad: 1 }])
    expect(a.id).not.toBe(b.id)
  })

  it("devuelve lista vacía si lo recibido no es un arreglo de repuestos", () => {
    expect(itemsDesdePrecargados(undefined)).toEqual([])
    expect(itemsDesdePrecargados("hola")).toEqual([])
    expect(itemsDesdePrecargados([null, 5, {}])).toEqual([])
  })

  it("usa 1 si la cantidad no es válida y usa los valores del repuesto vacío por defecto", () => {
    const [item] = itemsDesdePrecargados([{ descripcion: "Pieza", cantidad: -4 }])
    expect(item.cantidad).toBe(itemVacio().cantidad)
    expect(item.unidad).toBe(itemVacio().unidad)
  })
})
