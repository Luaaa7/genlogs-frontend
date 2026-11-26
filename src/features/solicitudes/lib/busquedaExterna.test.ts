import { describe, expect, it } from 'vitest'
import { enlacesBusqueda, terminoDeBusqueda } from './busquedaExterna'

describe('búsqueda externa por ítem', () => {
  it('usa el número de parte y, si no hay, el nombre del ítem', () => {
    expect(terminoDeBusqueda({ numeroParte: '1R-0750', descripcion: 'Filtro de aceite' })).toBe('1R-0750')
    expect(terminoDeBusqueda({ numeroParte: '  ', descripcion: 'Filtro de aceite' })).toBe('Filtro de aceite')
    expect(terminoDeBusqueda({ numeroParte: null, descripcion: ' Filtro de aceite ' })).toBe('Filtro de aceite')
  })

  it('arma los 4 enlaces, en orden, con el término codificado', () => {
    const enlaces = enlacesBusqueda('Filtro & aceite 1/2')
    expect(enlaces.map((e) => e.nombre)).toEqual(['Google', 'eBay', 'Amazon', 'Alibaba'])
    const q = encodeURIComponent('Filtro & aceite 1/2')
    expect(enlaces[0].url).toBe(`https://www.google.com/search?q=${q}`)
    expect(enlaces[1].url).toBe(`https://www.ebay.com/sch/i.html?_nkw=${q}`)
    expect(enlaces[2].url).toBe(`https://www.amazon.com/s?k=${q}`)
    expect(enlaces[3].url).toBe(`https://www.alibaba.com/trade/search?SearchText=${q}`)
  })
})
