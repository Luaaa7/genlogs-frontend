import { describe, expect, it } from 'vitest'
import { tiempoRespuestaDias } from './calculos'
import type { Cotizacion } from '@/types/cotizacion.types'

const base = {
  idCliente: 1,
  idMoneda: 1,
  idCondicionPago: 1,
  codigoCotizacion: '20261106-01',
  fechaCotizacion: '2026-11-01',
  fechaValidez: '2026-11-16',
  observaciones: null,
  estadoCotizacion: 'ENVIADA',
  condicionPago: 'CONTADO',
  moneda: 'PEN',
  subtotal: 100,
  igv: 18,
  total: 118,
  detalles: [],
} as Cotizacion

describe('tiempo de respuesta', () => {
  it('promedia los días hasta el primer seguimiento', () => {
    const dias = tiempoRespuestaDias([
      { ...base, fechaCreacion: '2026-11-01', seguimientos: [{ idEstadoCotizacion: 2, estadoAnterior: 'BORRADOR', estadoNuevo: 'ENVIADA', fechaEvento: '2026-11-03', fecha: '2026-11-03', observaciones: '' }] },
      { ...base, fechaCreacion: '2026-11-01', seguimientos: [{ idEstadoCotizacion: 2, estadoAnterior: 'BORRADOR', estadoNuevo: 'ENVIADA', fechaEvento: '2026-11-05', fecha: '2026-11-05', observaciones: '' }] },
    ])
    expect(dias).toBe(3)
  })

  it('no inventa un tiempo si no hay seguimiento', () => {
    expect(tiempoRespuestaDias([base])).toBeNull()
  })
})
