import { describe, it, expect } from 'vitest'
import { margenDesdePrecio, precioDesdeCosto, reglaProducto, reglaServicio, type EscalaMargenes } from './margenes'

const escala: EscalaMargenes = {
  productos: [
    { costoDesde: 0, costoHasta: 100, margenSugerido: 40, margenMinimo: 30 },
    { costoDesde: 100, costoHasta: 500, margenSugerido: 35, margenMinimo: 25 },
    { costoDesde: 500, costoHasta: null, margenSugerido: 20, margenMinimo: 12 },
  ],
  servicios: [
    { idCategoriaServicio: null, nombreCategoria: 'Cualquier otro servicio', margenSugerido: 35, margenMinimo: 25 },
    { idCategoriaServicio: 7, nombreCategoria: 'Consultoría', margenSugerido: 45, margenMinimo: 35 },
  ],
}

describe('escala de márgenes', () => {
  it('elige el rango de producto por costo (el "hasta" no se incluye)', () => {
    expect(reglaProducto(escala, 50)).toEqual({ sugerido: 40, minimo: 30 })
    expect(reglaProducto(escala, 100)).toEqual({ sugerido: 35, minimo: 25 })
    expect(reglaProducto(escala, 99999)).toEqual({ sugerido: 20, minimo: 12 })
  })

  it('servicio: usa su categoría, la de su padre o el margen por defecto', () => {
    expect(reglaServicio(escala, 7)).toEqual({ sugerido: 45, minimo: 35 })
    expect(reglaServicio(escala, 99, 7)).toEqual({ sugerido: 45, minimo: 35 })
    expect(reglaServicio(escala, 99)).toEqual({ sugerido: 35, minimo: 25 })
  })

  it('calcula el precio con margen sobre la venta y el margen desde el precio', () => {
    expect(precioDesdeCosto(100, 30)).toBe(142.86)
    expect(precioDesdeCosto(100, 0)).toBe(100)
    expect(margenDesdePrecio(100, 142.86)).toBe(30)
    expect(margenDesdePrecio(100, 125)).toBe(20)
  })
})