import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import { cerrarCarrito } from "@/lib/carritoPublico"
import { useCotizacionCart } from "./useCotizacionCart"

const filtro = { id: 1, nombre: "Filtro de combustible", marca: "Caterpillar", numeroParte: "1R-0750" }
const rodamiento = { id: 2, nombre: "Rodamiento 6205", marca: "SKF", numeroParte: "6205-2RS" }

describe("useCotizacionCart", () => {
  beforeEach(() => {
    localStorage.clear()
    cerrarCarrito()
  })

  it("empieza vacío", () => {
    const { result } = renderHook(() => useCotizacionCart())
    expect(result.current.items).toEqual([])
    expect(result.current.total).toBe(0)
    expect(result.current.cantidadDe(1)).toBe(0)
  })

  it("agregar suma a la cantidad si ya existe y total cuenta los repuestos distintos", () => {
    const { result } = renderHook(() => useCotizacionCart())

    act(() => result.current.agregar(filtro))
    act(() => result.current.agregar(filtro))
    act(() => result.current.agregar(rodamiento))

    expect(result.current.total).toBe(2)
    expect(result.current.cantidadDe(1)).toBe(2)
    expect(result.current.cantidadDe(2)).toBe(1)
  })

  it("sumar y restar cambian de a una unidad; restar con 1 quita el repuesto", () => {
    const { result } = renderHook(() => useCotizacionCart())
    act(() => result.current.agregar(filtro))

    act(() => result.current.sumar(1))
    expect(result.current.cantidadDe(1)).toBe(2)
    act(() => result.current.restar(1))
    expect(result.current.cantidadDe(1)).toBe(1)
    act(() => result.current.restar(1))
    expect(result.current.items).toEqual([])
  })

  it("dos usos del hook ven el mismo carrito", () => {
    const a = renderHook(() => useCotizacionCart())
    const b = renderHook(() => useCotizacionCart())

    act(() => a.result.current.agregar(filtro))

    expect(b.result.current.cantidadDe(1)).toBe(1)
  })

  it("quitar, vaciar y el panel abierto", () => {
    const { result } = renderHook(() => useCotizacionCart())
    act(() => result.current.agregar(filtro))
    act(() => result.current.agregar(rodamiento))

    act(() => result.current.quitar(1))
    expect(result.current.items.map((i) => i.id)).toEqual([2])
    act(() => result.current.abrir())
    expect(result.current.abierto).toBe(true)
    act(() => result.current.cerrar())
    expect(result.current.abierto).toBe(false)
    act(() => result.current.vaciar())
    expect(result.current.total).toBe(0)
  })
})
