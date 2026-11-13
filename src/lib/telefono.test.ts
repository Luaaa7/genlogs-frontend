import { describe, expect, it } from 'vitest'
import { cambiarPrefijo, completarPrefijo, ejemploTelefono, limpiarTelefono, telefonoValido } from './telefono'

describe('telefono', () => {
  it('deja solo números y un + al inicio', () => {
    expect(limpiarTelefono('+51 984-215 330')).toBe('+51984215330')
    expect(limpiarTelefono('98+4')).toBe('984')
  })

  it('arma el ejemplo con el prefijo del país', () => {
    expect(ejemploTelefono('+56')).toBe('+56 984 215 330')
    expect(ejemploTelefono(null)).toBe('+00 000 000 000')
  })

  it('pone el prefijo si el número no lo trae', () => {
    expect(completarPrefijo('984215330', '+51')).toBe('+51984215330')
    expect(completarPrefijo('0221234567', '+54')).toBe('+54221234567')
    expect(completarPrefijo('+56912345678', '+51')).toBe('+56912345678')
    expect(completarPrefijo('984215330', null)).toBe('984215330')
    expect(completarPrefijo('', '+51')).toBe('')
  })

  it('cambia el prefijo al cambiar de país solo si era el del país anterior', () => {
    expect(cambiarPrefijo('+51984215330', '+51', '+56')).toBe('+56984215330')
    expect(cambiarPrefijo('+1555123', '+51', '+56')).toBe('+1555123')
    expect(cambiarPrefijo('+51984215330', '+51', null)).toBe('+51984215330')
  })

  it('valida entre 6 y 15 dígitos', () => {
    expect(telefonoValido('')).toBe(true)
    expect(telefonoValido('+51984215330')).toBe(true)
    expect(telefonoValido('984 215 330')).toBe(true)
    expect(telefonoValido('+5112')).toBe(false)
    expect(telefonoValido('+1234567890123456')).toBe(false)
  })
})