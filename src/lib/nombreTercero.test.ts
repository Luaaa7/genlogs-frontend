import { describe, it, expect } from 'vitest'
import { nombreCompleto, nombresParaEditar, prepararNombreTercero, separarNombreCompleto } from './nombreTercero'

describe('nombreTercero', () => {
  it('arma el nombre completo sin espacios de más', () => {
    expect(nombreCompleto(' Ana  María ', 'López', '')).toBe('Ana María López')
    expect(nombreCompleto('Juan', 'Pérez', 'Gómez')).toBe('Juan Pérez Gómez')
  })

  it('con RUC deja la razón social y quita los nombres', () => {
    const r = prepararNombreTercero({ tercero: { idTipoDocumento: 1, razonSocial: ' Minera SAC ', nombres: 'x', apellidoPaterno: 'y' } })
    expect(r.tercero.razonSocial).toBe('Minera SAC')
    expect(r.tercero.nombres).toBeUndefined()
  })

  it('con DNI o pasaporte la razón social sale de los nombres y apellidos', () => {
    const r = prepararNombreTercero({ tercero: { idTipoDocumento: 4, nombres: 'John', apellidoPaterno: 'Smith', apellidoMaterno: '' } })
    expect(r.tercero.razonSocial).toBe('John Smith')
  })

  it('propone nombres y apellidos para registros antiguos', () => {
    expect(separarNombreCompleto('ANA MARIA LOPEZ RUIZ')).toEqual({ nombres: 'ANA MARIA', apellidoPaterno: 'LOPEZ', apellidoMaterno: 'RUIZ' })
    expect(separarNombreCompleto('LOPEZ RUIZ, ANA MARIA')).toEqual({ nombres: 'ANA MARIA', apellidoPaterno: 'LOPEZ', apellidoMaterno: 'RUIZ' })
    expect(separarNombreCompleto('JOHN SMITH')).toEqual({ nombres: 'JOHN', apellidoPaterno: 'SMITH', apellidoMaterno: '' })
  })

  it('al editar usa los apellidos guardados si existen', () => {
    expect(nombresParaEditar({ razonSocial: 'X Y Z', nombres: 'Ana', apellidoPaterno: 'López', apellidoMaterno: null }))
      .toEqual({ nombres: 'Ana', apellidoPaterno: 'López', apellidoMaterno: '' })
  })
})