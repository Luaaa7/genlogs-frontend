import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@/features/configuracion/hooks/useMargenes', () => ({
  useEscalaMargenes: () => ({
    data: {
      productos: [
        { costoDesde: 0, costoHasta: 100, margenSugerido: 40, margenMinimo: 30 },
        { costoDesde: 100, costoHasta: null, margenSugerido: 25, margenMinimo: 15 },
      ],
      servicios: [{ idCategoriaServicio: null, nombreCategoria: 'Otros', margenSugerido: 35, margenMinimo: 25 }],
    },
  }),
}))
vi.mock('@/lib/permisos', () => ({ usePermisos: () => ({ editarCatalogos: false }) }))
vi.mock('./SelectorCatalogoItem', () => ({
  SelectorCatalogoItem: ({ onSeleccionar }: { onSeleccionar: (i: unknown) => void }) => (
    <button type="button" onClick={() => onSeleccionar({ tipo: 'producto', id: 9, nombre: 'Filtro', codigo: 'F-1' })}>elegir filtro</button>
  ),
}))

import { AgregarItemModal } from './AgregarItemModal'

describe('AgregarItemModal: margen según la escala', () => {
  it('sugiere el margen por costo, calcula el precio y avisa si baja del mínimo', () => {
    const onAgregar = vi.fn()
    render(<AgregarItemModal moneda="PEN" onAgregar={onAgregar} onCerrar={() => {}} />)
    fireEvent.click(screen.getByText('elegir filtro'))
    fireEvent.change(screen.getByLabelText(/costo unitario/i), { target: { value: '60' } })

    const margen = screen.getByLabelText(/margen %/i) as HTMLInputElement
    expect(margen.value).toBe('40')
    expect(screen.getByText(/sugerido 40 % · mínimo 30 %/i)).toBeTruthy()
    expect(screen.getAllByText(/100\.00/).length).toBeGreaterThan(0) // 60 / (1 - 0.40) = 100

    fireEvent.change(margen, { target: { value: '20' } })
    expect(screen.getByRole('alert').textContent).toMatch(/por debajo del mínimo/i)

    fireEvent.click(screen.getByRole('button', { name: 'Agregar ítem' }))
    expect(onAgregar).toHaveBeenCalledWith(expect.objectContaining({
      idProducto: 9, costoUnitario: 60, margenPorcentaje: 20, margenMinimo: 30, precioUnitario: 75,
    }))
  })
})