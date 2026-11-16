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
const tipoCambioHook = vi.hoisted(() => vi.fn(() => ({ data: { valor: 9 } })))
vi.mock('@/features/tipo-cambio/hooks/useTipoCambio', () => ({
  useTipoCambio: () => tipoCambioHook(),
}))
const historial = vi.hoisted(() => vi.fn())
vi.mock('@/api/sourcingApi', () => ({ sourcingApi: { historial } }))
vi.mock('./SelectorCatalogoItem', () => ({
  SelectorCatalogoItem: ({ onSeleccionar, onEscribir, tipo }: { onSeleccionar: (i: unknown) => void; onEscribir: (t: string) => void; tipo?: string }) => (
    <div>
      <span>buscando: {tipo}</span>
      <button type="button" onClick={() => onSeleccionar({ tipo: 'producto', id: 9, nombre: 'Filtro', codigo: 'F-1' })}>elegir filtro</button>
      <button type="button" onClick={() => onEscribir('Manguera suelta')}>escribir texto libre</button>
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
    const onAgregar = vi.fn()
    render(<AgregarItemModal moneda="USD" tipoCambio={4} onAgregar={onAgregar} onCerrar={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Servicio' }))
    fireEvent.click(screen.getByText('elegir servicio con precio'))
    // S/ 100 y S/ 125 a 4 soles por dólar: US$ 25 y US$ 31.25
    expect((screen.getByLabelText(/costo unitario/i) as HTMLInputElement).value).toBe('25')
    expect(screen.getByText(/al tipo de cambio 4\.000/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Agregar ítem' }))
    expect(onAgregar).toHaveBeenCalledWith(expect.objectContaining({ costoUnitario: 25, precioUnitario: 31.25 }))
  })

  it('en dólares sin tipo de cambio no convierte y pide escribir el costo', () => {
    render(<AgregarItemModal moneda="USD" tipoCambio={null} onAgregar={() => {}} onCerrar={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Servicio' }))
    fireEvent.click(screen.getByText('elegir servicio con precio'))
    expect((screen.getByLabelText(/costo unitario/i) as HTMLInputElement).value).toBe('')
    expect(screen.getByText(/no hay tipo de cambio de hoy/i)).toBeTruthy()
  })

  it('el costo no pasa de un repuesto a un servicio ni de un servicio a otro', () => {
    render(<AgregarItemModal moneda="PEN" onAgregar={() => {}} onCerrar={() => {}} />)
    const costo = () => screen.getByLabelText(/costo unitario/i) as HTMLInputElement
    fireEvent.click(screen.getByText('elegir filtro'))
    fireEvent.change(costo(), { target: { value: '60' } })
    fireEvent.click(screen.getByRole('tab', { name: 'Servicio' }))
    expect(costo().value).toBe('')
    fireEvent.click(screen.getByText('elegir servicio con precio'))
    expect(costo().value).toBe('100')
    fireEvent.click(screen.getByText('elegir servicio sin costo'))
    expect(costo().value).toBe('')
    fireEvent.click(screen.getByRole('tab', { name: 'Producto' }))
    expect(costo().value).toBe('')
  })

  it('convierte un historial útil en dólares con el tipo de cambio recibido, no con el del día', async () => {
    historial.mockResolvedValue([
      referencia({ estado: 'UTIL', precioRef: 100, codigoMoneda: 'USD', titulo: 'Filtro de aceite' }),
      referencia({ idSourcing: 2, estado: 'CAPTURADO', titulo: 'Capturada', precioRef: 10, urlReferencia: null }),
    ])
    const onAgregar = vi.fn()
    render(<AgregarItemModal moneda="PEN" tipoCambio={4} onAgregar={onAgregar} onCerrar={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }))
    fireEvent.change(screen.getByLabelText(/número de parte/i), { target: { value: '1R-0750' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar en el historial' }))
    expect(historial).toHaveBeenCalledWith({ numeroParte: '1R-0750' })
    expect(await screen.findByText('Capturada')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Capturada' })).toBeNull()
    expect(screen.getByRole('link', { name: /ver en la tienda/i }).getAttribute('href')).toBe('https://tienda.example/item')
    fireEvent.click(await screen.findByRole('button', { name: 'Filtro de aceite' }))

    expect((screen.getByLabelText(/costo unitario/i) as HTMLInputElement).value).toBe('400')
    expect(screen.getAllByText(/400\.00/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/533\.33/).length).toBeGreaterThan(0)
    expect(tipoCambioHook).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Agregar ítem' }))
    const linea = onAgregar.mock.calls[0][0] as Record<string, unknown>
    expect(linea).toMatchObject({
      producto: 'Filtro de aceite · CAT · 1R-0750',
      tipoItem: 'producto',
      costoUnitario: 400,
      precioUnitario: 533.33,
    })
    expect(linea.idProducto).toBeUndefined()
    expect(linea.idServicio).toBeUndefined()
    expect(linea.fuente).toBeUndefined()
    expect(linea.urlReferencia).toBeUndefined()
    expect(linea.urlImagen).toBeUndefined()
    expect(JSON.stringify(linea)).not.toMatch(/https?:|ALIEXPRESS|tienda\.example/)
  })

  it('con precioRef null no agrega ni muestra 0 hasta tener costo y moneda', async () => {
    historial.mockResolvedValue([
      referencia({ estado: 'UTIL', precioRef: null, costoPuestoLima: null, titulo: 'Sin precio', urlReferencia: null }),
    ])
    const onAgregar = vi.fn()
    render(<AgregarItemModal moneda="PEN" tipoCambio={4} onAgregar={onAgregar} onCerrar={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Historial' }))
    fireEvent.change(screen.getByLabelText(/número de parte/i), { target: { value: '1R-0750' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar en el historial' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Sin precio' }))

    expect((screen.getByLabelText(/costo unitario/i) as HTMLInputElement).value).toBe('')
    expect(screen.queryByText('0')).toBeNull()
    expect(screen.queryByText(/0\.00/)).toBeNull()
    expect(screen.queryByText(/0 %/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Agregar ítem' }))
    expect(onAgregar).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/costo de la referencia/i), { target: { value: '80' } })
    fireEvent.click(screen.getByRole('button', { name: 'Agregar ítem' }))
    expect(onAgregar).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/moneda del costo/i), { target: { value: 'USD' } })
    expect((screen.getByLabelText(/costo unitario/i) as HTMLInputElement).value).toBe('320')
    fireEvent.click(screen.getByRole('button', { name: 'Agregar ítem' }))
    expect(onAgregar).toHaveBeenCalledWith(expect.objectContaining({ costoUnitario: 320, producto: 'Sin precio · CAT · 1R-0750' }))
    const linea = onAgregar.mock.calls[0][0] as Record<string, unknown>
    expect(linea.fuente).toBeUndefined()
    expect(linea.urlReferencia).toBeUndefined()
  })

  it('agrega un servicio sin costo con el precio estándar y sin margen en 0 %', () => {
    const onAgregar = vi.fn()
    render(<AgregarItemModal moneda="PEN" onAgregar={onAgregar} onCerrar={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Servicio' }))
    fireEvent.click(screen.getByText('elegir servicio sin costo'))
    expect((screen.getByLabelText(/margen %/i) as HTMLInputElement).value).toBe('')
    expect(screen.queryByText(/0 %/)).toBeNull()
    expect(screen.getAllByText(/500\.00/).length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Agregar ítem' }))
    const linea = onAgregar.mock.calls[0][0] as Record<string, unknown>
    expect(linea).toMatchObject({ idServicio: 6, precioUnitario: 500 })
    expect(linea.margenPorcentaje).toBeUndefined()
    expect(linea.costoUnitario).toBeUndefined()
  })

  it('si se escribe el precio, al cambiar el costo se conserva y el margen se recalcula', () => {
    render(<AgregarItemModal moneda="PEN" onAgregar={() => {}} onCerrar={() => {}} />)
    fireEvent.click(screen.getByText('elegir filtro'))
    fireEvent.change(screen.getByLabelText(/costo unitario/i), { target: { value: '60' } })
    fireEvent.change(screen.getByLabelText(/^precio de venta/i), { target: { value: '90' } })
    fireEvent.change(screen.getByLabelText(/costo unitario/i), { target: { value: '40' } })
    expect((screen.getByLabelText(/^precio de venta/i) as HTMLInputElement).value).toBe('90')
    expect(screen.getAllByText(/90\.00/).length).toBeGreaterThan(0)
    expect((screen.getByLabelText(/margen %/i) as HTMLInputElement).value).toBe('55.6')
    expect(screen.getByText('El costo cambió. Se mantuvo el precio y se recalculó el margen.')).toBeTruthy()
  })

  it('un texto libre, sin ids, entra al formulario', () => {
    const onAgregar = vi.fn()
    render(<AgregarItemModal moneda="PEN" onAgregar={onAgregar} onCerrar={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'escribir texto libre' }))
    fireEvent.change(screen.getByLabelText(/costo unitario/i), { target: { value: '60' } })
    fireEvent.click(screen.getByRole('button', { name: 'Agregar ítem' }))
    const linea = onAgregar.mock.calls[0][0] as Record<string, unknown>
    expect(linea).toMatchObject({
      producto: 'Manguera suelta',
      tipoItem: 'producto',
      cantidad: 1,
      costoUnitario: 60,
      precioUnitario: 100,
    })
    expect(linea.idProducto).toBeUndefined()
    expect(linea.idServicio).toBeUndefined()
    expect(linea.fuente).toBeUndefined()
    expect(linea.urlReferencia).toBeUndefined()
  })

  it('el costo del producto en dólares se muestra en soles antes del precio', () => {
    render(<AgregarItemModal moneda="PEN" tipoCambio={4} onAgregar={() => {}} onCerrar={() => {}} />)
    fireEvent.click(screen.getByText('elegir filtro'))
    fireEvent.change(screen.getByLabelText(/moneda del costo/i), { target: { value: 'USD' } })
    fireEvent.change(screen.getByLabelText(/costo unitario/i), { target: { value: '100' } })
    const resumen = screen.getByText('Precio de venta unitario').closest('dl')?.textContent ?? ''
    expect(resumen).toMatch(/400\.00/)
    expect(resumen.indexOf('400.00')).toBeLessThan(resumen.indexOf('533.33'))
    expect(tipoCambioHook).not.toHaveBeenCalled()
  })

  it('sin tipo de cambio el costo en otra moneda queda vacío para escribirlo en la de la cotización', () => {
    const onAgregar = vi.fn()
    render(<AgregarItemModal moneda="PEN" tipoCambio={null} onAgregar={onAgregar} onCerrar={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'escribir texto libre' }))
    fireEvent.change(screen.getByLabelText(/moneda del costo/i), { target: { value: 'USD' } })
    fireEvent.change(screen.getByLabelText(/costo unitario/i), { target: { value: '100' } })
    expect(screen.getByText(/escribe el costo en la moneda de la cotización/i)).toBeTruthy()
    expect((screen.getByLabelText(/costo en la cotización/i) as HTMLInputElement).value).toBe('')
    expect(screen.queryByText(/400\.00/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Agregar ítem' }))
    expect(onAgregar).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText(/costo en la cotización/i), { target: { value: '80' } })
    fireEvent.click(screen.getByRole('button', { name: 'Agregar ítem' }))
    expect(onAgregar).toHaveBeenCalledWith(expect.objectContaining({ producto: 'Manguera suelta', costoUnitario: 80, idProducto: undefined }))
  })
})

function referencia(parcial: Record<string, unknown>) {
  return {
    idSourcing: 1,
    idSolicitudItem: null,
    fuente: 'ALIEXPRESS',
    metodo: 'NUMERO_PARTE',
    titulo: 'Filtro',
    marca: 'CAT',
    numeroParte: '1R-0750',
    precioRef: 100,
    codigoMoneda: 'USD',
    costoPuestoLima: null,
    urlReferencia: 'https://tienda.example/item',
    urlImagenRef: 'https://img.example/1.jpg',
    estado: 'UTIL',
    editadoAMano: false,
    creadoEn: '2026-11-15T10:00:00',
    ...parcial,
  }
}