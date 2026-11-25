import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  CLAVE_CARRITO,
  MAX_ITEMS_CARRITO,
  agregarAlCarrito,
  cambiarCantidad,
  carritoAPrecargados,
  carritoAbierto,
  cerrarCarrito,
  abrirCarrito,
  destinoTrasAcceso,
  leerCarrito,
  quitarDelCarrito,
  suscribirCarrito,
  vaciarCarrito,
} from "./carritoPublico"

const filtro = { id: 1, nombre: "Filtro de combustible", marca: "Caterpillar", numeroParte: "1R-0750" }
const rodamiento = { id: 2, nombre: "Rodamiento 6205", marca: "SKF", numeroParte: "6205-2RS" }

describe("carrito de cotización público (genlogs_public_cart)", () => {
  beforeEach(() => {
    localStorage.clear()
    cerrarCarrito()
  })

  it("empieza vacío", () => {
    expect(leerCarrito()).toEqual([])
  })

  it("guarda cada repuesto con id, nombre, marca, número de parte y cantidad 1", () => {
    agregarAlCarrito(filtro)

    expect(leerCarrito()).toEqual([{ ...filtro, cantidad: 1 }])
    expect(JSON.parse(localStorage.getItem("genlogs_public_cart") ?? "null")).toEqual([{ ...filtro, cantidad: 1 }])
    expect(CLAVE_CARRITO).toBe("genlogs_public_cart")
  })

  it("si el repuesto ya está, suma a su cantidad en vez de duplicar la fila", () => {
    agregarAlCarrito(filtro)
    agregarAlCarrito(filtro)
    agregarAlCarrito({ ...filtro, cantidad: 3 })

    expect(leerCarrito()).toEqual([{ ...filtro, cantidad: 5 }])
  })

  it("mantiene el orden en que se agregaron", () => {
    agregarAlCarrito(filtro)
    agregarAlCarrito(rodamiento)
    agregarAlCarrito(filtro)

    expect(leerCarrito().map((i) => i.id)).toEqual([1, 2])
  })

  it("cambiarCantidad fija la cantidad; menos de 1 quita el repuesto", () => {
    agregarAlCarrito(filtro)
    agregarAlCarrito(rodamiento)

    cambiarCantidad(1, 7)
    expect(leerCarrito()[0].cantidad).toBe(7)

    cambiarCantidad(1, 0)
    expect(leerCarrito().map((i) => i.id)).toEqual([2])
  })

  it("redondea la cantidad a un entero y la limita a 9999", () => {
    agregarAlCarrito(filtro)
    cambiarCantidad(1, 2.7)
    expect(leerCarrito()[0].cantidad).toBe(2)
    cambiarCantidad(1, 50000)
    expect(leerCarrito()[0].cantidad).toBe(9999)
  })

  it("quita un repuesto y vacía el carrito", () => {
    agregarAlCarrito(filtro)
    agregarAlCarrito(rodamiento)

    quitarDelCarrito(1)
    expect(leerCarrito().map((i) => i.id)).toEqual([2])

    vaciarCarrito()
    expect(leerCarrito()).toEqual([])
    expect(localStorage.getItem(CLAVE_CARRITO)).toBeNull()
  })

  it("no pasa de 50 repuestos distintos (el máximo del backend), pero sí suma a los que ya están", () => {
    for (let id = 1; id <= MAX_ITEMS_CARRITO; id++) agregarAlCarrito({ id, nombre: `Pieza ${id}`, marca: "", numeroParte: "" })

    expect(agregarAlCarrito({ id: 999, nombre: "Una más", marca: "", numeroParte: "" })).toBe(false)
    expect(leerCarrito()).toHaveLength(MAX_ITEMS_CARRITO)
    expect(agregarAlCarrito({ id: 1, nombre: "Pieza 1", marca: "", numeroParte: "" })).toBe(true)
    expect(leerCarrito()[0].cantidad).toBe(2)
  })

  it("ignora un contenido dañado o con filas inválidas", () => {
    localStorage.setItem(CLAVE_CARRITO, "esto no es json")
    expect(leerCarrito()).toEqual([])

    localStorage.setItem(
      CLAVE_CARRITO,
      JSON.stringify([{ ...filtro, cantidad: 2 }, { id: "x" }, null, { ...rodamiento, cantidad: 0 }, { ...rodamiento, cantidad: 1, marca: 5 }]),
    )
    expect(leerCarrito()).toEqual([{ ...filtro, cantidad: 2 }, { ...rodamiento, cantidad: 1, marca: "" }])
  })

  it("avisa a quien esté mirando cuando el carrito cambia", () => {
    const aviso = vi.fn()
    const dejar = suscribirCarrito(aviso)

    agregarAlCarrito(filtro)
    expect(aviso).toHaveBeenCalledTimes(1)
    quitarDelCarrito(1)
    expect(aviso).toHaveBeenCalledTimes(2)

    dejar()
    agregarAlCarrito(filtro)
    expect(aviso).toHaveBeenCalledTimes(2)
  })

  it("recuerda si el panel del carrito está abierto", () => {
    expect(carritoAbierto()).toBe(false)
    abrirCarrito()
    expect(carritoAbierto()).toBe(true)
    cerrarCarrito()
    expect(carritoAbierto()).toBe(false)
  })

  it("se convierte en lo que espera NuevaSolicitudPage (descripción = nombre)", () => {
    agregarAlCarrito({ ...filtro, cantidad: 3 })
    agregarAlCarrito(rodamiento)

    expect(carritoAPrecargados()).toEqual([
      { idProducto: 1, descripcion: "Filtro de combustible", marca: "Caterpillar", numeroParte: "1R-0750", cantidad: 3 },
      { idProducto: 2, descripcion: "Rodamiento 6205", marca: "SKF", numeroParte: "6205-2RS", cantidad: 1 },
    ])
  })
})

describe("destinoTrasAcceso: a dónde va el cliente al ingresar o registrarse", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("sin carrito y sin ?volver= va a Mis pedidos", () => {
    expect(destinoTrasAcceso("")).toBe("/portal/pedidos")
  })

  it("con repuestos en el carrito va a la solicitud", () => {
    agregarAlCarrito(filtro)
    expect(destinoTrasAcceso("")).toBe("/portal/solicitud")
  })

  it("un ?volver= explícito manda sobre el carrito", () => {
    agregarAlCarrito(filtro)
    expect(destinoTrasAcceso("?volver=%2Fportal%2Fcotizaciones")).toBe("/portal/cotizaciones")
  })

  it("ignora un ?volver= que no sea una ruta propia", () => {
    expect(destinoTrasAcceso("?volver=https%3A%2F%2Fotro.com")).toBe("/portal/pedidos")
  })
})
