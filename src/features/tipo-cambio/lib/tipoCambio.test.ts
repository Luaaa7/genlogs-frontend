import { describe, expect, it } from 'vitest'
import { aNumero, formatoValor, textoFuente, validarTipoCambio } from './tipoCambio'

describe('tipo de cambio (RF-86)', () => {
  it('acepta punto o coma decimal y hasta 4 decimales', () => {
    expect(validarTipoCambio('3.7525')).toBeNull()
    expect(validarTipoCambio('3,75')).toBeNull()
    expect(validarTipoCambio('3.75000')).toBeNull()
    expect(aNumero('3,75')).toBe(3.75)
  })

  it('rechaza vacío, texto, cero, más de 4 decimales y valores que no son un dólar en soles', () => {
    expect(validarTipoCambio('')).toMatch(/Escribe/)
    expect(validarTipoCambio('3.7.5')).toMatch(/números/)
    expect(validarTipoCambio('0')).toMatch(/mayor que 0/)
    expect(validarTipoCambio('3.75251')).toMatch(/4 decimales/)
    expect(validarTipoCambio('375')).toMatch(/Revisa el valor/)
    expect(validarTipoCambio('0.27')).toMatch(/Revisa el valor/)
  })

  it('muestra 4 decimales y de dónde salió el valor', () => {
    expect(formatoValor(3.79)).toBe('3.7900')
    expect(textoFuente('SUNAT')).toMatch(/SUNAT/)
    expect(textoFuente('MANUAL')).toMatch(/Corregido/)
  })
})
