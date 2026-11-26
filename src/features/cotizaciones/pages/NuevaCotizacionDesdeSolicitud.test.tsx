import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { ItemIdentificacion, SolicitudInternaResponse } from '@/api/contratos/solicitudes'
import { solicitudesInternasApi } from '@/features/solicitudes/api/solicitudesInternasApi'
import { NuevaCotizacionPage } from './NuevaCotizacionPage'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }))
vi.mock('@/api/axiosClient', () => ({ axiosClient: http }))

const clienteMinera = {
  idCliente: 4,
  situacion: 'ACTIVO',
  status: 'A',
  tercero: { idTercero: 4, numeroDocumento: '20123456789', razonSocial: 'Minera Sur', tipoDocumento: { codigoTipo: 'RUC', nombreTipo: 'RUC' } },
}

const solicitud: SolicitudInternaResponse = {
  idSolicitud: 7, codigoSolicitud: 'SOL-2026-7', asunto: 'Filtros', cliente: 'Minera Sur', estado: 'EN_REVISION', tipoPlazo: 'COMUN',
  fechaRecepcion: '2026-11-10T09:00:00', fechaLimiteInterna: null, pausadaDesde: null, motivoPausa: null, fechaEstimadaTercero: null,
  reclasificaciones: 0, asignado: null, idCliente: 4, idCotizacion: null, codigoCotizacion: null,
}

const item = (cambios: Partial<ItemIdentificacion>): ItemIdentificacion => ({
  idItem: 1, descripcion: 'Filtro de aire', cantidad: 2, unidad: 'UND', idMarca: null, marca: 'Caterpillar', numeroParte: '1R-0750', gtin: null,
  urlFoto: null, idProducto: 9, equivalentes: [], confirmado: true, confirmadoPor: null, fechaConfirmacion: null, ...cambios,
})

function pintar(ruta: string) {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[ruta]}>
        <NuevaCotizacionPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Nueva cotización desde una solicitud', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    http.get.mockImplementation((url: string) => {
      if (url === '/clientes') return Promise.resolve({ data: [clienteMinera] })
      if (url === '/tipo-cambio') return Promise.reject({ response: { status: 404 } })
      if (url === '/productos') return Promise.resolve({ data: { content: [], totalPages: 0 } })
      if (url === '/servicios') return Promise.resolve({ data: [] })
      if (url === '/catalogos/igv') return Promise.resolve({ data: { porcentaje: 18 } })
      return Promise.resolve({ data: { content: [] } })
    })
    http.post.mockResolvedValue({ data: { idCotizacion: 60, codigoCotizacion: 'COT-2026-60' } })
    vi.spyOn(solicitudesInternasApi, 'detalle').mockResolvedValue(solicitud)
    vi.spyOn(solicitudesInternasApi, 'items').mockResolvedValue([
      item({}),
      item({ idItem: 2, descripcion: 'Sello de goma', idProducto: null, numeroParte: null }),
    ])
  })

  it('trae la solicitud: cliente, repuesto del catálogo y aviso de lo que falta elegir', async () => {
    pintar('/cotizaciones/nueva?solicitud=7')
    expect((await screen.findByText(/Cotizando la solicitud/)).textContent).toContain('SOL-2026-7')
    expect(await screen.findByDisplayValue('Filtro de aire')).toBeTruthy()
    expect(screen.getByText(/Sello de goma/)).toBeTruthy()
    expect(screen.getByText(/falta elegirlos del catálogo/i)).toBeTruthy()
  })

  it('al crear la cotización la liga con la solicitud', async () => {
    const vincular = vi.spyOn(solicitudesInternasApi, 'vincularCotizacion').mockResolvedValue({ ...solicitud, idCotizacion: 60, codigoCotizacion: 'COT-2026-60' })
    pintar('/cotizaciones/nueva?solicitud=7')
    await screen.findByDisplayValue('Filtro de aire')
    fireEvent.click(screen.getByRole('radio', { name: 'Contado' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Soles (S/)' }))
    fireEvent.change(screen.getByLabelText('Precio unitario del ítem 1'), { target: { value: '10' } })
    await waitFor(() => expect((screen.getByRole('button', { name: 'Revisar y crear' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: 'Revisar y crear' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar y crear' }))
    await waitFor(() => expect(vincular).toHaveBeenCalledWith(7, 60))
  })

  it('sin solicitud en la dirección funciona como siempre y no pide nada de solicitudes', async () => {
    pintar('/cotizaciones/nueva')
    await screen.findByRole('heading', { name: 'Nueva cotización' })
    expect(solicitudesInternasApi.detalle).not.toHaveBeenCalled()
  })
})
