import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { formatearMoneda } from '@/lib/formatters/codigoCotizacion'
import { CotizacionDetallePage } from './CotizacionDetallePage'
import { CotizacionesListPage } from './CotizacionesListPage'

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/api/axiosClient', () => ({ axiosClient: http }))

let cabecera: Record<string, unknown>

function cliente() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

function pintarDetalle(rol: string) {
  useAuthStore.setState({ nombreRol: rol })
  return render(
    <QueryClientProvider client={cliente()}>
      <MemoryRouter initialEntries={['/cotizaciones/1']}>
        <Routes>
          <Route path="/cotizaciones/:id" element={<CotizacionDetallePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function pintarLista(rol: string) {
  useAuthStore.setState({ nombreRol: rol })
  return render(
    <QueryClientProvider client={cliente()}>
      <MemoryRouter>
        <CotizacionesListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('aprobación de la cotización', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cabecera = {
      idCotizacion: 1, idCliente: 4, codigoCotizacion: 'COT-001', estado: 'BORRADOR',
      fechaCotizacion: '2026-11-10', fechaValidez: '2026-12-10', condicionPago: 'CONTADO',
      moneda: 'PEN', clienteRazonSocial: 'Minera Sur', subtotal: 100, igv: 18, total: 118,
    }
    http.get.mockImplementation((url: string) => {
      if (url === '/cotizaciones/1') return Promise.resolve({ data: cabecera })
      if (url.endsWith('/lineas') || url.endsWith('/seguimiento') || url.endsWith('/adjuntos')) return Promise.resolve({ data: [] })
      if (url === '/cotizaciones') return Promise.resolve({ data: { content: [{ ...cabecera, estadoCotizacion: 'BORRADOR' }], totalElements: 1, totalPages: 1 } })
      if (url === '/cotizaciones/estadisticas') return Promise.resolve({ data: { totalCotizaciones: 1, totalPorEstado: {}, montoTotalPendiente: 0, tasaAprobacion: 0 } })
      return Promise.resolve({ data: { content: [] } })
    })
    http.post.mockResolvedValue({ data: cabecera })
  })

  it('un rol sin acceso ve el vacío y no pide la cotización', () => {
    pintarDetalle('CONTADOR_GENERAL')
    expect(screen.getByText('No tienes acceso a las cotizaciones')).toBeTruthy()
    expect(http.get).not.toHaveBeenCalled()
  })

  it('sin margen la vista sigue en pie y el asistente administrativo no lo ve', async () => {
    const primera = pintarDetalle('GERENTE_GENERAL')
    expect(await screen.findByText('COT-001')).toBeTruthy()
    expect(screen.queryByText('Margen')).toBeNull()
    primera.unmount()
    cabecera = { ...cabecera, margen: 20 }
    pintarDetalle('ASISTENTE_ADMINISTRATIVO')
    expect(await screen.findByText('COT-001')).toBeTruthy()
    expect(screen.queryByText('Margen')).toBeNull()
  })

  it('muestra el margen y el tipo de cambio solo si vienen y el rol puede ver el margen', async () => {
    cabecera = { ...cabecera, margen: 12.5, tipoCambioUsado: 3.7512 }
    const primera = pintarDetalle('GERENTE_GENERAL')
    expect(await screen.findByText('Margen')).toBeTruthy()
    const cambio = (3.7512).toLocaleString('es-PE', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
    expect(screen.getByText(cambio)).toBeTruthy()
    primera.unmount()
    cabecera = { ...cabecera, tipoCambioUsado: undefined }
    pintarDetalle('JEFE_ADMINISTRATIVO')
    expect(await screen.findByText('COT-001')).toBeTruthy()
    expect(screen.queryByText('Tipo de cambio usado')).toBeNull()
  })

  it('muestra el precio de proveedor solo si viene y el rol puede ver márgenes', async () => {
    cabecera = { ...cabecera, precioProveedor: 1500 }
    const conPrecio = pintarDetalle('GERENTE_GENERAL')
    const etiqueta = await screen.findByText('Precio de proveedor')
    expect(etiqueta.parentElement?.querySelector('dd')?.textContent).toBe(formatearMoneda(1500, 'PEN'))
    conPrecio.unmount()

    cabecera = { ...cabecera, precioProveedor: null }
    const sinPrecio = pintarDetalle('GERENTE_GENERAL')
    expect(await screen.findByText('COT-001')).toBeTruthy()
    expect(screen.queryByText('Precio de proveedor')).toBeNull()
    sinPrecio.unmount()

    cabecera = { ...cabecera, precioProveedor: 1500 }
    const sinMargen = pintarDetalle('ASISTENTE_ADMINISTRATIVO')
    expect(await screen.findByText('COT-001')).toBeTruthy()
    expect(screen.queryByText('Precio de proveedor')).toBeNull()
    sinMargen.unmount()
  })

  it('el asistente solicita aprobación solo en borrador y enviar queda deshabilitado', async () => {
    const primera = pintarDetalle('ASISTENTE_LOGISTICO')
    expect(await screen.findByRole('button', { name: 'Solicitar aprobación' })).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Enviar al cliente' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(/cuando el Jefe la haya aprobado/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar aprobación' }))
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/cotizaciones/1/solicitar-aprobacion'))
    primera.unmount()
    cabecera = { ...cabecera, estado: 'PENDIENTE_APROBACION' }
    pintarDetalle('ASISTENTE_LOGISTICO')
    expect(await screen.findByRole('button', { name: 'Enviar al cliente' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Solicitar aprobación' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Aprobar' })).toBeNull()
    expect((screen.getByRole('button', { name: 'Enviar al cliente' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('solo el Jefe aprueba y devuelve, y el motivo es obligatorio', async () => {
    cabecera = { ...cabecera, estado: 'PENDIENTE_APROBACION' }
    pintarDetalle('JEFE_ADMINISTRATIVO')
    expect(await screen.findByRole('button', { name: 'Aprobar' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Devolver' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Solicitar aprobación' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Devolver' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar devolución' }))
    expect(await screen.findByText('Indica el motivo para devolver la cotización')).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: '  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar devolución' }))
    expect(await screen.findByText('Indica el motivo para devolver la cotización')).toBeTruthy()
    expect(http.post).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'ab' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar devolución' }))
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/cotizaciones/1/devolver', { motivo: 'ab' }))
  })

  it('enviar se habilita en aprobada por el Jefe', async () => {
    cabecera = { ...cabecera, estado: 'APROBADA_INTERNA' }
    pintarDetalle('ASISTENTE_LOGISTICO')
    expect(await screen.findByRole('button', { name: 'Enviar al cliente' })).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Enviar al cliente' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('desde borrador el menú del Jefe solo ofrece anular, y puede solicitar la aprobación de la suya', async () => {
    pintarDetalle('JEFE_ADMINISTRATIVO')
    fireEvent.click(await screen.findByRole('button', { name: 'Cambiar estado' }))
    const menu = screen.getByRole('menu')
    expect(within(menu).getByRole('menuitemradio', { name: 'Anulada' })).toBeTruthy()
    expect(within(menu).queryByRole('menuitemradio', { name: 'Enviada' })).toBeNull()
    expect(within(menu).queryByRole('menuitemradio', { name: 'Aprobada' })).toBeNull()
    // El Jefe también crea cotizaciones (decisión del equipo, 13/11/2026).
    expect(screen.getByRole('button', { name: 'Solicitar aprobación' })).toBeTruthy()
  })

  it('el Jefe y el Asistente Logístico ven Nueva cotización y Duplicar', async () => {
    const primera = pintarLista('JEFE_ADMINISTRATIVO')
    expect(await screen.findByText('COT-001')).toBeTruthy()
    expect(await screen.findByRole('link', { name: /nueva cotización/i })).toBeTruthy()
    expect(await screen.findByRole('button', { name: /duplicar cot-001/i })).toBeTruthy()
    primera.unmount()
    pintarLista('ASISTENTE_LOGISTICO')
    expect(await screen.findByRole('link', { name: /nueva cotización/i })).toBeTruthy()
    expect(await screen.findByRole('button', { name: /duplicar cot-001/i })).toBeTruthy()
  })
})