import { describe, expect, it } from 'vitest'
import { esClientePersonaNatural } from './documentoCliente'

describe('esClientePersonaNatural (solo los clientes con RUC tienen orden de compra)', () => {
  it('RUC: no es persona natural, venga como texto u objeto', () => {
    expect(esClientePersonaNatural({ tipoDocumento: 'RUC', numeroDocumento: '20123456789' })).toBe(false)
    expect(esClientePersonaNatural({ tipoDocumento: { codigoTipo: 'RUC' } as never, numeroDocumento: '20123456789' })).toBe(false)
  })

  it('DNI, pasaporte o carné de extranjería: sí', () => {
    expect(esClientePersonaNatural({ tipoDocumento: 'DNI', numeroDocumento: '45678912' })).toBe(true)
    expect(esClientePersonaNatural({ tipoDocumento: { codigoTipo: 'DNI' } as never, numeroDocumento: '45678912' })).toBe(true)
    expect(esClientePersonaNatural({ tipoDocumento: 'PASAPORTE', numeroDocumento: 'X123' })).toBe(true)
  })

  it('el tipo manda sobre el número', () => {
    expect(esClientePersonaNatural({ tipoDocumento: 'RUC', numeroDocumento: '10456789' })).toBe(false)
  })

  it('sin tipo, decide el número: 11 dígitos es RUC; 8 dígitos u otro formato, no', () => {
    expect(esClientePersonaNatural({ numeroDocumento: '20123456789' })).toBe(false)
    expect(esClientePersonaNatural({ numeroDocumento: '45678912' })).toBe(true)
    expect(esClientePersonaNatural({ tipoDocumento: '', numeroDocumento: ' 4567 8912 ' })).toBe(true)
  })

  it('sin datos no se asume nada', () => {
    expect(esClientePersonaNatural(undefined)).toBe(false)
    expect(esClientePersonaNatural({})).toBe(false)
  })
})
