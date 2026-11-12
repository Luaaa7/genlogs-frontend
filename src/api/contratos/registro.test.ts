import { describe, expect, it } from 'vitest'
import { esRutaInterna, leerVolver, rutaRegistro } from './registro'

describe('?volver= del registro (D-30)', () => {
  it('arma la ruta del registro con la pagina de regreso', () => {
    expect(rutaRegistro('/catalogo?q=filtro')).toBe('/portal/registro?volver=%2Fcatalogo%3Fq%3Dfiltro')
    expect(rutaRegistro()).toBe('/portal/registro')
  })

  it('lee la ruta de regreso', () => {
    expect(leerVolver('?volver=%2Fcatalogo%3Fq%3Dfiltro')).toBe('/catalogo?q=filtro')
    expect(leerVolver('')).toBe('/portal/pedidos')
  })

  it('no deja mandar a otro sitio', () => {
    expect(esRutaInterna('https://otro.com')).toBe(false)
    expect(esRutaInterna('//otro.com')).toBe(false)
    expect(leerVolver('?volver=https%3A%2F%2Fotro.com')).toBe('/portal/pedidos')
    expect(rutaRegistro('//otro.com')).toBe('/portal/registro')
  })
})