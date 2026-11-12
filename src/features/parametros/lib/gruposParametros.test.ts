import { describe, expect, it } from 'vitest'
import { GRUPOS_PARAMETROS, clavesCambiadas, ordenDeGuardado, validarGrupo } from './gruposParametros'

const grupo = (id: string) => GRUPOS_PARAMETROS.find((g) => g.id === id)!
const servicios = grupo('margenesServicio')
const plazos = grupo('plazos')
const ORDEN = servicios.ordenadas!

describe('validación de parámetros (RF-87)', () => {
  it('acepta coma decimal y valores en orden', () => {
    expect(validarGrupo(servicios, { MARGEN_SERV_MIN: '15', MARGEN_SERV_SUGERIDO: '25,5', MARGEN_SERV_AVISO: '35', MARGEN_SERV_MAX: '45' })).toBeNull()
  })

  it('rechaza márgenes de servicios fuera de orden', () => {
    expect(validarGrupo(servicios, { MARGEN_SERV_MIN: '30', MARGEN_SERV_SUGERIDO: '25', MARGEN_SERV_AVISO: '35', MARGEN_SERV_MAX: '45' }))
      .toMatch(/mínimo ≤ sugerido/)
  })

  it('rechaza vacíos, negativos, decimales en días y porcentajes de más de 100', () => {
    const base = { PLAZO_COMUN_DIAS: '1', PLAZO_IMPORTADO_DIAS: '3', PLAZO_ESPECIAL_DIAS: '5', ALERTA_PLAZO_PCT: '75' }
    expect(validarGrupo(plazos, base)).toBeNull()
    expect(validarGrupo(plazos, { ...base, PLAZO_COMUN_DIAS: '' })).toMatch(/número/)
    expect(validarGrupo(plazos, { ...base, PLAZO_COMUN_DIAS: '1.5' })).toMatch(/entero/)
    expect(validarGrupo(plazos, { ...base, ALERTA_PLAZO_PCT: '120' })).toMatch(/100/)
  })
})

describe('guardado de márgenes de servicios sin romper el orden', () => {
  const antes = { MARGEN_SERV_MIN: '15', MARGEN_SERV_SUGERIDO: '25', MARGEN_SERV_AVISO: '35', MARGEN_SERV_MAX: '45' }

  it('si todo sube, guarda del máximo al mínimo', () => {
    const despues = { MARGEN_SERV_MIN: '50', MARGEN_SERV_SUGERIDO: '60', MARGEN_SERV_AVISO: '70', MARGEN_SERV_MAX: '80' }
    expect(ordenDeGuardado(ORDEN, antes, despues)).toEqual(['MARGEN_SERV_MAX', 'MARGEN_SERV_AVISO', 'MARGEN_SERV_SUGERIDO', 'MARGEN_SERV_MIN'])
  })

  it('si todo baja, guarda del mínimo al máximo', () => {
    const despues = { MARGEN_SERV_MIN: '5', MARGEN_SERV_SUGERIDO: '8', MARGEN_SERV_AVISO: '10', MARGEN_SERV_MAX: '12' }
    expect(ordenDeGuardado(ORDEN, antes, despues)).toEqual(['MARGEN_SERV_MIN', 'MARGEN_SERV_SUGERIDO', 'MARGEN_SERV_AVISO', 'MARGEN_SERV_MAX'])
  })

  it('cada paso intermedio cumple el orden', () => {
    const despues = { MARGEN_SERV_MIN: '10', MARGEN_SERV_SUGERIDO: '40', MARGEN_SERV_AVISO: '41', MARGEN_SERV_MAX: '42' }
    const actual: Record<string, string> = { ...antes }
    for (const clave of ordenDeGuardado(ORDEN, antes, despues)) {
      actual[clave] = despues[clave as keyof typeof despues]
      expect(validarGrupo(servicios, actual)).toBeNull()
    }
    expect(actual).toEqual(despues)
  })

  it('solo guarda lo que cambió (25 y 25,0 son lo mismo)', () => {
    expect(clavesCambiadas(servicios, antes, { ...antes, MARGEN_SERV_SUGERIDO: '25,0' })).toEqual([])
    expect(ordenDeGuardado(ORDEN, antes, { ...antes, MARGEN_SERV_MAX: '50' })).toEqual(['MARGEN_SERV_MAX'])
  })
})
