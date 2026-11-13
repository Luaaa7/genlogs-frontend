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
const tipoCambio = vi.hoisted(() => ({ valor: 4 as number | null }))
vi.mock('@/features/tipo-cambio/hooks/useTipoCambio', () => ({
  useTipoCambio: () => ({ data: tipoCambio.valor === null ? null : { valor: tipoCambio.valor } }),
}))
vi.mock('./SelectorCatalogoItem', () => ({
  SelectorCatalogoItem: ({ onSeleccionar, tipo }: { onSeleccionar: (i: unknown) => void; tipo?: string }) => (
    <div>
      <span>buscando: {tipo}</span>
      <button type="button" onClick={() => onSeleccionar({ tipo: 'producto', id: 9, nombre: 'Filtro', codigo: 'F-1' })}>elegir filtro</button>
      <button type="button" onClick={() => onSeleccionar({ tipo: 'servicio', id: 4, nombre: 'Mantenimiento', codigo: 'S-1' })}>elegir servicio</button>
      <button type="button" onClick={() => onSeleccionar({ tipo: 'servicio', id: 5, nombre: 'Traslado', codigo: 'S-2', costo: 100, precioReferencial: 125 })}>elegir servicio con precio</button>
      <button type="button" onClick={() => onSeleccionar({ tipo: 'servicio', id: 6, nombre: 'PLC', codigo: 'S-3', precioReferencial: 500 })}>elegir servicio sin costo</button>
    </div>
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
      idProducto: 9, tipoItem: 'producto', costoUnitario: 60, margenPorcentaje: 20, margenMinimo: 30, precioUnitario: 75,
    }))
  })

  it('separa repuestos y servicios en pestañas y usa el margen del servicio', () => {
    const onAgregar = vi.fn()
    render(<AgregarItemModal moneda="PEN" onAgregar={onAgregar} onCerrar={() => {}} />)
    expect(screen.getByText('buscando: producto')).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: 'Servicio' }))
    expect(screen.getByRole('tab', { name: 'Servicio' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByText('buscando: servicio')).toBeTruthy()

    fireEvent.click(screen.getByText('elegir servicio'))
    fireEvent.change(screen.getByLabelText(/costo unitario/i), { target: { value: '100' } })
    expect((screen.getByLabelText(/margen %/i) as HTMLInputElement).value).toBe('35')

    fireEvent.click(screen.getByRole('button', { name: 'Agregar ítem' }))
    expect(onAgregar).toHaveBeenCalledWith(expect.objectContaining({ idServicio: 4, tipoItem: 'servicio', margenPorcentaje: 35 }))
  })

  it('trae el costo y el precio estándar del servicio y deja cambiarlos', () => {
    const onAgregar = vi.fn()
    render(<AgregarItemModal moneda="PEN" onAgregar={onAgregar} onCerrar={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Servicio' }))
    fireEvent.click(screen.getByText('elegir servicio con precio'))
    expect((screen.getByLabelText(/costo unitario/i) as HTMLInputElement).value).toBe('100')
    expect((screen.getByLabelText(/margen %/i) as HTMLInputElement).value).toBe('20')
    expect(screen.getByText(/precio estándar del servicio/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Agregar ítem' }))
    expect(onAgregar).toHaveBeenCalledWith(expect.objectContaining({ idServicio: 5, costoUnitario: 100, precioUnitario: 125 }))
  })

  it('sin costo muestra el precio estándar y el margen sale al escribir el costo', () => {
    const onAgregar = vi.fn()
    render(<AgregarItemModal moneda="PEN" onAgregar={onAgregar} onCerrar={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Servicio' }))
    fireEvent.click(screen.getByText('elegir servicio sin costo'))
    expect((screen.getByLabelText(/costo unitario/i) as HTMLInputElement).value).toBe('')
    expect(screen.getAllByText(/500\.00/).length).toBeGreaterThan(0)

    fireEvent.change(screen.getByLabelText(/costo unitario/i), { target: { value: '400' } })
    expect((screen.getByLabelText(/margen %/i) as HTMLInputElement).value).toBe('20')
    fireEvent.click(screen.getByRole('button', { name: 'Agregar ítem' }))
    expect(onAgregar).toHaveBeenCalledWith(expect.objectContaining({ idServicio: 6, costoUnitario: 400, precioUnitario: 500, margenPorcentaje: 20 }))
  })

  it('si se escribe otro margen, el precio se recalcula y se puede volver al estándar', () => {
    render(<AgregarItemModal moneda="PEN" onAgregar={() => {}} onCerrar={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Servicio' }))
    fireEvent.click(screen.getByText('elegir servicio con precio'))
    fireEvent.change(screen.getByLabelText(/margen %/i), { target: { value: '50' } })
    expect(screen.getAllByText(/200\.00/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Usar el precio estándar' }))
    expect((screen.getByLabelText(/margen %/i) as HTMLInputElement).value).toBe('20')
  })

  it('si el rol no ve el costo, el campo queda vacío para escribirlo', () => {
    render(<AgregarItemModal moneda="PEN" onAgregar={() => {}} onCerrar={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Servicio' }))
    fireEvent.click(screen.getByText('elegir servicio'))
    expect((screen.getByLabelText(/costo unitario/i) as HTMLInputElement).value).toBe('')
  })

  it('en una cotización en dólares convierte el costo y el precio con el tipo de cambio', () => {
    tipoCambio.valor = 4
    const onAgregar = vi.fn()
    render(<AgregarItemModal moneda="USD" onAgregar={onAgregar} onCerrar={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Servicio' }))
    fireEvent.click(screen.getByText('elegir servicio con precio'))
    // S/ 100 y S/ 125 a 4 soles por dólar: US$ 25 y US$ 31.25
    expect((screen.getByLabelText(/costo unitario/i) as HTMLInputElement).value).toBe('25')
    expect(screen.getByText(/al tipo de cambio 4\.000/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Agregar ítem' }))
    expect(onAgregar).toHaveBeenCalledWith(expect.objectContaining({ costoUnitario: 25, precioUnitario: 31.25 }))
  })

  it('en dólares sin tipo de cambio no convierte y pide escribir el costo', () => {
    tipoCambio.valor = null
    render(<AgregarItemModal moneda="USD" onAgregar={() => {}} onCerrar={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Servicio' }))
    fireEvent.click(screen.getByText('elegir servicio con precio'))
    expect((screen.getByLabelText(/costo unitario/i) as HTMLInputElement).value).toBe('')
    expect(screen.getByText(/no hay tipo de cambio de hoy/i)).toBeTruthy()
    tipoCambio.valor = 4
  })
})