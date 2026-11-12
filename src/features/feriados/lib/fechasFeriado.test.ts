import { describe, expect, it } from 'vitest'
import { esFutura, fechaLarga, manana, validarFeriado } from './fechasFeriado'

// Viernes 13 de noviembre de 2026, de noche (en UTC ya sería sábado).
const HOY = new Date(2026, 10, 13, 23, 30)

describe('fechas de feriados (D-18)', () => {
  it('mañana se calcula en hora local, sin saltar de día por UTC', () => {
    expect(manana(HOY)).toBe('2026-11-14')
    expect(manana(new Date(2026, 11, 31))).toBe('2027-01-01')
  })

  it('solo las fechas posteriores a hoy son futuras', () => {
    expect(esFutura('2026-11-13', HOY)).toBe(false)
    expect(esFutura('2026-11-14', HOY)).toBe(true)
  })

  it('muestra la fecha completa en español', () => {
    expect(fechaLarga('2026-12-25')).toMatch(/viernes.*25.*diciembre.*2026/)
  })

  it('valida como el backend', () => {
    const existentes = [{ fecha: '2026-12-25' }]
    expect(validarFeriado('', 'Navidad', existentes, HOY)).toMatch(/fecha/)
    expect(validarFeriado('2026-11-13', 'Hoy', existentes, HOY)).toMatch(/futuras/)
    expect(validarFeriado('2026-12-08', '   ', existentes, HOY)).toMatch(/motivo/)
    expect(validarFeriado('2026-12-08', 'x'.repeat(101), existentes, HOY)).toMatch(/100/)
    expect(validarFeriado('2026-12-25', 'Navidad', existentes, HOY)).toMatch(/Ya hay/)
    expect(validarFeriado('2026-12-08', 'Inmaculada Concepción', existentes, HOY)).toBeNull()
  })
})
