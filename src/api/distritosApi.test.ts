import { describe, it, expect } from 'vitest'
import { normalizarDistrito, ubicacionDistrito } from './distritosApi'

describe('normalizarDistrito', () => {
  it('backend viejo: solo id, nombre y ubigeo (sin provincia) no revienta', () => {
    const d = normalizarDistrito({ idDistrito: 1, nombreDistrito: 'Miraflores', ubigeo: '150122' })
    expect(d.nombreProvincia).toBeUndefined()
    expect(ubicacionDistrito(d)).toBe('')
  })

  it('backend nuevo: campos planos', () => {
    const d = normalizarDistrito({
      idDistrito: 1, nombreDistrito: 'Miraflores', ubigeo: '150122',
      nombreProvincia: 'Lima', nombreDepartamento: 'Lima',
    })
    expect(ubicacionDistrito(d)).toBe('Lima, Lima')
  })

  it('formato anidado', () => {
    const d = normalizarDistrito({
      idDistrito: 2, nombreDistrito: 'Yanahuara', ubigeo: '040129',
      provincia: { nombreProvincia: 'Arequipa', departamento: { nombreDepartamento: 'Arequipa' } },
    })
    expect(d.nombreProvincia).toBe('Arequipa')
    expect(d.nombreDepartamento).toBe('Arequipa')
  })

  it('provincia nula no revienta', () => {
    const d = normalizarDistrito({ idDistrito: 3, nombreDistrito: 'X', ubigeo: '1', provincia: null })
    expect(d.nombreProvincia).toBeUndefined()
  })
})
