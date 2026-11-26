import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ItemIdentificacion } from '@/api/contratos/solicitudes'
import { ItemsSolicitud } from './ItemsSolicitud'

const item = (id: number, extra: Partial<ItemIdentificacion> = {}): ItemIdentificacion => ({
  idItem: id, descripcion: `Repuesto ${id}`, cantidad: 2, unidad: 'UND', idMarca: null, marca: 'Caterpillar', numeroParte: `NP-${id}`,
  gtin: null, urlFoto: null, idProducto: null, equivalentes: [], confirmado: false, confirmadoPor: null, fechaConfirmacion: null, ...extra,
})

const fila = (n: string) => screen.getByText(n).closest('li') as HTMLElement

describe('ItemsSolicitud', () => {
  it('lista cada ítem con descripción, cantidad, marca y número de parte', () => {
    render(<ItemsSolicitud items={[item(1)]} buscar={false} />)
    const li = fila('Repuesto 1')
    expect(li.textContent).toContain('2 UND')
    expect(li.textContent).toContain('Caterpillar')
    expect(li.textContent).toContain('NP-1')
  })

  it('con buscar=false no muestra buscadores externos', () => {
    render(<ItemsSolicitud items={[item(1)]} buscar={false} />)
    expect(screen.queryByRole('link', { name: /google/i })).toBeNull()
  })

  it('con buscar=true cada ítem trae Google, eBay, Amazon y Alibaba que abren en pestaña nueva y de forma segura', () => {
    render(<ItemsSolicitud items={[item(1), item(2, { numeroParte: null, descripcion: 'Sello de goma' })]} buscar />)
    const primera = within(fila('Repuesto 1'))
    for (const nombre of ['Google', 'eBay', 'Amazon', 'Alibaba']) {
      const enlace = primera.getByRole('link', { name: new RegExp(`${nombre}`, 'i') })
      expect(enlace.getAttribute('target')).toBe('_blank')
      expect(enlace.getAttribute('rel')).toBe('noopener noreferrer')
    }
    expect(primera.getByRole('link', { name: /google/i }).getAttribute('href')).toBe(`https://www.google.com/search?q=${encodeURIComponent('NP-1')}`)
    const segunda = within(fila('Sello de goma'))
    expect(segunda.getByRole('link', { name: /amazon/i }).getAttribute('href')).toBe(`https://www.amazon.com/s?k=${encodeURIComponent('Sello de goma')}`)
  })

  it('el nombre accesible dice qué ítem se busca', () => {
    render(<ItemsSolicitud items={[item(1)]} buscar />)
    expect(screen.getByRole('link', { name: 'Buscar NP-1 en Google' })).toBeTruthy()
  })

  it('sin ítems lo dice', () => {
    render(<ItemsSolicitud items={[]} buscar />)
    expect(screen.getByText(/no tiene ítems/i)).toBeTruthy()
  })
})
