import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { CotizacionesListPage } from './CotizacionesListPage'

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/api/axiosClient', () => ({ axiosClient: http }))

const dia = '2026-11-23'
const antigua = {
  idCotizacion: 1,
  codigoCotizacion: '20261123-01ADM',
  estadoCotizacion: 'ACEPTADA_CLIENTE',
  fechaCotizacion: dia,
  fechaCreacion: '2026-11-23T09:00:00',
  fechaValidez: '2026-12-08',
  moneda: 'PEN',
  clienteNombre: 'Cliente antiguo',
  total: 100,
}
const nueva = {
  idCotizacion: 4,
  codigoCotizacion: '20261123-04ADM',
  estadoCotizacion: 'ACEPTADA_CLIENTE',
  fechaCotizacion: dia,
  fechaCreacion: '2026-11-23T14:05:00',
  fechaValidez: '2026-12-08',
  moneda: 'PEN',
  clienteNombre: 'Cliente nuevo',
  total: 200,
}

function paramsDe(llamada: unknown[]) {
  return (llamada[1] as { params: URLSearchParams }).params
}

function pintar() {
  useAuthStore.setState({ nombreRol: 'ASISTENTE_LOGISTICO' })
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter>
        <CotizacionesListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('orden del listado de cotizaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    http.get.mockImplementation((url: string, config?: { params?: URLSearchParams }) => {
      if (url === '/cotizaciones') {
        const dir = config?.params?.get('sortDir')
        const content = dir === 'ASC' ? [antigua, nueva] : [nueva, antigua]
        return Promise.resolve({ data: { content, totalElements: 2, totalPages: 1 } })
      }
      if (url === '/cotizaciones/estadisticas') {
        return Promise.resolve({ data: { totalCotizaciones: 2, totalPorEstado: {}, montoTotalPendiente: 0, tasaAprobacion: 0 } })
      }
      return Promise.resolve({ data: { content: [] } })
    })
  })

  it('pide la hora de creación y pone primero la última del mismo día', async () => {
    pintar()
    const primera = await screen.findByRole('link', { name: '20261123-04ADM' })
    const filas = screen.getAllByRole('row')
    expect(filas[1]).toContainElement(primera)
    expect(filas[2].textContent).toContain('20261123-01ADM')
    expect(screen.getAllByText('23/11/2026')).toHaveLength(2)

    const lista = http.get.mock.calls.filter((c) => c[0] === '/cotizaciones')
    expect(paramsDe(lista[0]).get('sortBy')).toBe('dateCreate')
    expect(paramsDe(lista[0]).get('sortDir')).toBe('DESC')

    fireEvent.change(screen.getByLabelText('Ordenar por'), { target: { value: 'ASC' } })
    await waitFor(() => expect(screen.getAllByRole('row')[1].textContent).toContain('20261123-01ADM'))
    const otra = http.get.mock.calls.filter((c) => c[0] === '/cotizaciones').at(-1)!
    expect(paramsDe(otra).get('sortBy')).toBe('dateCreate')
    expect(paramsDe(otra).get('sortDir')).toBe('ASC')
  })
})
