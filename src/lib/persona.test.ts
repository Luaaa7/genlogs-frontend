import { describe, expect, it } from 'vitest'
import { armarNombrePersona, partirNombre } from './persona'

describe('nombre de persona', () => {
  it('separa nombres y apellidos y los vuelve a unir igual', () => {
    const partes = partirNombre('Juan Carlos Perez Lopez')
    expect(partes).toEqual({
      nombre: 'Juan',
      segundoNombre: 'Carlos',
      apellidoPaterno: 'Perez',
      apellidoMaterno: 'Lopez',
    })
    expect(armarNombrePersona(partes)).toBe('Juan Carlos Perez Lopez')
  })

  it('con un solo nombre deja los apellidos vacíos', () => {
    expect(partirNombre('Juan')).toEqual({
      nombre: 'Juan',
      segundoNombre: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
    })
  })
})
