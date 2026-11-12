import { describe, expect, it } from 'vitest'
import { esDistritoExtranjero, prepararUbicacion } from './terceroExtranjero'
import { terceroSchema } from './validators/rucDni.schema'

describe('ubicación del tercero (D-15)', () => {
  it('en Perú manda el distrito y quita la ubicación en texto', () => {
    const r = prepararUbicacion({
      tercero: { idDistrito: 10, esExtranjero: false, ciudadExtranjero: 'Calama', regionExtranjero: 'X' },
    })
    expect(r.tercero).toEqual({ idDistrito: 10, regionExtranjero: undefined, ciudadExtranjero: undefined, codigoPostalExtranjero: undefined })
  })

  it('fuera de Perú manda el texto (sin espacios de más) y no el distrito', () => {
    const r = prepararUbicacion({
      tercero: { idDistrito: 10, idPais: 7, esExtranjero: true, regionExtranjero: ' Antofagasta ', ciudadExtranjero: 'Calama', codigoPostalExtranjero: '' },
    })
    expect(r.tercero).toEqual({
      idDistrito: undefined,
      idPais: 7,
      regionExtranjero: 'Antofagasta',
      ciudadExtranjero: 'Calama',
      codigoPostalExtranjero: undefined,
    })
  })

  it('reconoce el distrito viejo "Extranjero" del catálogo para ocultarlo', () => {
    expect(esDistritoExtranjero({ ubigeo: '900101', nombreDistrito: 'Otro' })).toBe(true)
    expect(esDistritoExtranjero({ ubigeo: '000000', nombreDistrito: 'Extranjero' })).toBe(true)
    expect(esDistritoExtranjero({ ubigeo: '110301', nombreDistrito: 'Nazca' })).toBe(false)
  })
})

describe('validación de la ubicación', () => {
  const base = { idTipoDocumento: 1, numeroDocumento: '20512345671', razonSocial: 'Minera SAC' }

  it('en Perú el distrito es obligatorio', () => {
    const r = terceroSchema.safeParse(base)
    expect(r.success).toBe(false)
    expect(r.error?.issues.some((i) => i.path[0] === 'idDistrito')).toBe(true)
    expect(terceroSchema.safeParse({ ...base, idDistrito: 10 }).success).toBe(true)
  })

  it('fuera de Perú no pide distrito, pero sí la ciudad', () => {
    const sinCiudad = terceroSchema.safeParse({ ...base, idPais: 7, esExtranjero: true })
    expect(sinCiudad.success).toBe(false)
    expect(sinCiudad.error?.issues.map((i) => i.path[0])).toEqual(['ciudadExtranjero'])
    expect(terceroSchema.safeParse({ ...base, idPais: 7, esExtranjero: true, ciudadExtranjero: 'Calama' }).success).toBe(true)
  })
})
