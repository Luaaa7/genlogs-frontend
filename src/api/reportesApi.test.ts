import { describe, it, expect } from 'vitest'
import { adaptarPreview } from './reportesApi'

describe('adaptarPreview', () => {
  it('convierte filas-arreglo del backend en objetos por columna', () => {
    const r = adaptarPreview({ encabezados: ['Código', 'Total'], filas: [['C-1', '10.00'], ['C-2', '5.00']], totalFilas: 40 })
    expect(r.columnas).toEqual(['Código', 'Total'])
    expect(r.filas[0]).toEqual({ 'Código': 'C-1', Total: '10.00' })
    expect(r.total).toBe(40)
  })

  it('encabezados repetidos no se pisan', () => {
    const r = adaptarPreview({ encabezados: ['Moneda', 'Moneda'], filas: [['PEN', 'USD']] })
    expect(r.columnas).toEqual(['Moneda', 'Moneda (2)'])
    expect(r.filas[0]).toEqual({ Moneda: 'PEN', 'Moneda (2)': 'USD' })
  })

  it('acepta también el formato anterior { data, total }', () => {
    const r = adaptarPreview({ data: [{ a: 1, b: 'x' }], total: 7 })
    expect(r.columnas).toEqual(['a', 'b'])
    expect(r.filas).toEqual([{ a: 1, b: 'x' }])
    expect(r.total).toBe(7)
  })

  it('respuesta vacía', () => {
    const r = adaptarPreview({})
    expect(r).toEqual({ filas: [], total: 0, columnas: [] })
  })
})
