import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { CotizacionDetallePage } from './CotizacionDetallePage'

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))
const listarAvisos = vi.hoisted(() => vi.fn())

vi.mock('@/api/axiosClient', () => ({ axiosClient: http }))
vi.mock('../api/avisosCotizacionApi', () => ({ listarAvisos }))

const aviso = {
  idNotificacion: 7,
  tipo: 'ALTO_VALOR',
  titulo: 'Cotización de alto valor',
  mensaje: 'El Gerente debe ver esta cotización.',
  enlace: '/cotizaciones/1',
  leida: false,
  fechaCreacion: '2026-11-11T10:00:00',
}

function pintar(rol: string) {
  useAuthStore.setState({ nombreRol: rol })
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={['/cotizaciones/1']}>
        <Routes>
          <Route path="/cotizaciones/:id" element={<CotizacionDetallePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('banner de alto valor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    http.get.mockImplementation((url: string) => {
      if (url === '/cotizaciones/1') {
        return Promise.resolve({
          data: {
            idCotizacion: 1, idCliente: 4, codigoCotizacion: 'COT-001', estado: 'APROBADA_INTERNA',
            fechaCotizacion: '2026-11-10', fechaValidez: '2026-12-10', condicionPago: 'CONTADO',
            moneda: 'PEN', clienteRazonSocial: 'Minera Sur', subtotal: 100, igv: 18, total: 118,
          },
        })
      }
      if (url.endsWith('/lineas') || url.endsWith('/seguimiento') || url.endsWith('/adjuntos')) return Promise.resolve({ data: [] })
      return Promise.resolve({ data: { content: [] } })
    })
    listarAvisos.mockResolvedValue({ noLeidas: 1, avisos: [aviso] })
  })

  it('el Gerente ve el banner si el enlace es esta cotización', async () => {
    pintar('GERENTE_GENERAL')
    const titulo = await screen.findByText('Cotización de alto valor')
    expect(screen.getByText('El Gerente debe ver esta cotización.')).toBeTruthy()
    expect(titulo.closest('[role="status"]')?.querySelector('button')).toBeNull()
  })

  it('el Jefe y los asistentes no lo ven', async () => {
    for (const rol of ['JEFE_ADMINISTRATIVO', 'ASISTENTE_LOGISTICO', 'ASISTENTE_ADMINISTRATIVO']) {
      const vista = pintar(rol)
      expect(await screen.findByText('COT-001')).toBeTruthy()
      expect(screen.queryByText('Cotización de alto valor')).toBeNull()
      expect(listarAvisos).not.toHaveBeenCalled()
      vista.unmount()
    }
  })

  it('sin aviso la cotización sigue en pie', async () => {
    listarAvisos.mockResolvedValue({ noLeidas: 0, avisos: [] })
    const vacia = pintar('GERENTE_GENERAL')
    expect(await screen.findByText('COT-001')).toBeTruthy()
    expect(screen.queryByText('Cotización de alto valor')).toBeNull()
    vacia.unmount()

    listarAvisos.mockResolvedValue({ noLeidas: 1, avisos: [{ ...aviso, enlace: '/cotizaciones/99' }] })
    const otra = pintar('GERENTE_GENERAL')
    expect(await screen.findByText('COT-001')).toBeTruthy()
    expect(screen.queryByText('Cotización de alto valor')).toBeNull()
    otra.unmount()

    listarAvisos.mockRejectedValue(new Error('avisos caídos'))
    pintar('GERENTE_GENERAL')
    expect(await screen.findByText('COT-001')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
  })
})
