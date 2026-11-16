import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { formatearFechaCorta } from '@/lib/formatters/fechaLocal'
import { NuevaCotizacionPage } from './NuevaCotizacionPage'

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/api/axiosClient', () => ({ axiosClient: http }))

vi.mock('../components/AgregarItemModal', () => ({
  AgregarItemModal: ({ onAgregar }: { onAgregar: (item: Record<string, unknown>) => void }) => (
    <button
      type="button"
      onClick={() => onAgregar({
        producto: 'Filtro',
        idProducto: 9,
        tipoItem: 'producto',
        cantidad: 2,
        precioUnitario: 10,
        margenPorcentaje: 20,
        subtotal: 20,
      })}
    >
      Elegir filtro
    </button>
  ),
}))

const clienteMinera = {
  idCliente: 4,
  situacion: 'ACTIVO',
  status: 'A',
  tercero: {
    idTercero: 4,
    numeroDocumento: '20123456789',
    razonSocial: 'Minera Sur',
    tipoDocumento: { codigoTipo: 'RUC', nombreTipo: 'RUC' },
  },
}

let tipoCambio: { fecha: string; valor: number; esDeHoy: boolean; codigoMoneda: string; fuente: string } | null

function pintar() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const invalidar = vi.spyOn(cliente, 'invalidateQueries')
  const vista = render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter>
        <NuevaCotizacionPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { ...vista, invalidar }
}

async function elegirCliente() {
  fireEvent.change(screen.getByPlaceholderText('Escribe el RUC o la razón social'), { target: { value: 'Minera' } })
  fireEvent.mouseDown(await screen.findByRole('option', { name: /Minera Sur/ }))
}

async function completar(moneda: 'Dólares ($)' | 'Soles (S/)') {
  await elegirCliente()
  fireEvent.click(screen.getByRole('radio', { name: 'Contado' }))
  fireEvent.click(screen.getByRole('radio', { name: moneda }))
  fireEvent.click(screen.getByRole('button', { name: 'Agregar el primer ítem' }))
  fireEvent.click(screen.getByRole('button', { name: 'Elegir filtro' }))
}

describe('tipo de cambio al crear', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tipoCambio = { fecha: '2026-11-15', valor: 3.8, esDeHoy: true, codigoMoneda: 'USD', fuente: 'SUNAT' }
    http.get.mockImplementation((url: string) => {
      if (url === '/clientes') return Promise.resolve({ data: [clienteMinera] })
      if (url === '/tipo-cambio') {
        return tipoCambio ? Promise.resolve({ data: tipoCambio }) : Promise.reject({ response: { status: 404 } })
      }
      if (url === '/productos') return Promise.resolve({ data: { content: [], totalPages: 0 } })
      if (url === '/servicios') return Promise.resolve({ data: [] })
      if (url === '/catalogos/igv') return Promise.resolve({ data: { porcentaje: 18 } })
      return Promise.resolve({ data: { content: [] } })
    })
    http.post.mockResolvedValue({ data: { idCotizacion: 8, codigoCotizacion: 'COT-008' } })
  })

  it('en USD muestra el tipo de cambio propuesto y no lo manda en el POST', async () => {
    pintar()
    await completar('Dólares ($)')
    expect(await screen.findByText(`Tipo de cambio propuesto: 3.8000 del ${formatearFechaCorta('2026-11-15')}`)).toBeTruthy()
    await waitFor(() => expect((screen.getByRole('button', { name: 'Revisar y crear' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: 'Revisar y crear' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar y crear' }))
    await waitFor(() => expect(http.post).toHaveBeenCalled())
    const cuerpo = http.post.mock.calls.find((llamada) => llamada[0] === '/cotizaciones')?.[1] as { moneda?: string; tipoCambio?: number; fechaTipoCambio?: string }
    expect(cuerpo.moneda).toBe('USD')
    expect(cuerpo.tipoCambio).toBeUndefined()
    expect(cuerpo.fechaTipoCambio).toBeUndefined()
  })

  it('en soles no envía tipo de cambio ni fecha', async () => {
    pintar()
    await completar('Soles (S/)')
    await waitFor(() => expect((screen.getByRole('button', { name: 'Revisar y crear' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: 'Revisar y crear' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar y crear' }))
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/cotizaciones', expect.anything()))
    const cuerpo = http.post.mock.calls.find((llamada) => llamada[0] === '/cotizaciones')?.[1] as { tipoCambio?: number; fechaTipoCambio?: string; moneda?: string }
    expect(await screen.findByText(`Tipo de cambio propuesto: 3.8000 del ${formatearFechaCorta('2026-11-15')}`)).toBeTruthy()
    expect(cuerpo.tipoCambio).toBeUndefined()
    expect(cuerpo.fechaTipoCambio).toBeUndefined()
    expect(cuerpo.moneda).toBe('PEN')
  })

  it('sin tipo de cambio el alta sigue y el POST no manda el campo', async () => {
    tipoCambio = null
    pintar()
    await completar('Dólares ($)')
    expect(screen.queryByText(/Tipo de cambio propuesto/)).toBeNull()
    await waitFor(() => expect((screen.getByRole('button', { name: 'Revisar y crear' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: 'Revisar y crear' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar y crear' }))
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/cotizaciones', expect.anything()))
    const cuerpo = http.post.mock.calls.find((llamada) => llamada[0] === '/cotizaciones')?.[1] as { tipoCambio?: number }
    expect(cuerpo.tipoCambio).toBeUndefined()
  })

  it('si el dato no es de hoy, avisa que se usa el último guardado', async () => {
    tipoCambio = { fecha: '2026-11-14', valor: 3.71, esDeHoy: false, codigoMoneda: 'USD', fuente: 'SUNAT' }
    pintar()
    fireEvent.click(screen.getByRole('radio', { name: 'Dólares ($)' }))
    expect(await screen.findByText(`Hoy aún no hay tipo de cambio; se usa el último guardado del ${formatearFechaCorta('2026-11-14')}.`)).toBeTruthy()
  })

})
