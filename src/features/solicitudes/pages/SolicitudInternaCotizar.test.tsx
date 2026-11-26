import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { SolicitudInternaResponse } from '@/api/contratos/solicitudes'
import { useAuthStore } from '@/features/auth/store/authStore'
import { solicitudesInternasApi } from '../api/solicitudesInternasApi'
import { SolicitudInternaPage } from './SolicitudInternaPage'

vi.mock('@/api/usuariosApi', () => ({ listarUsuarios: vi.fn().mockResolvedValue([]) }))

const base = (cambios: Partial<SolicitudInternaResponse> = {}): SolicitudInternaResponse => ({
  idSolicitud: 99, codigoSolicitud: 'SOL-2026-99', asunto: 'Filtros', cliente: 'Minera Sur', estado: 'EN_REVISION', tipoPlazo: 'COMUN',
  fechaRecepcion: '2026-11-10T09:00:00', fechaLimiteInterna: null, pausadaDesde: null, motivoPausa: null, fechaEstimadaTercero: null,
  reclasificaciones: 0, asignado: null, idCliente: 4, idCotizacion: null, codigoCotizacion: null, ...cambios,
})

function pintar(id: number, rol: string) {
  useAuthStore.setState({ nombreRol: rol })
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[`/solicitudes/${id}`]}>
        <Routes>
          <Route path="/solicitudes/:id" element={<SolicitudInternaPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('SolicitudInternaPage · cotizar desde la solicitud', () => {
  beforeEach(() => {
    vi.spyOn(solicitudesInternasApi, 'items').mockResolvedValue([])
    vi.spyOn(solicitudesInternasApi, 'historial').mockResolvedValue([])
  })
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('abre la solicitud por su número aunque no se venga desde la lista', async () => {
    const detalle = vi.spyOn(solicitudesInternasApi, 'detalle').mockResolvedValue(base())
    pintar(99, 'ASISTENTE_LOGISTICO')
    expect(await screen.findByText('SOL-2026-99')).toBeTruthy()
    expect(detalle).toHaveBeenCalledWith(99)
  })

  it('si la solicitud no existe lo dice, en vez de pedir que se abra desde la lista', async () => {
    vi.spyOn(solicitudesInternasApi, 'detalle').mockRejectedValue(new Error('No se encontró la solicitud.'))
    pintar(99, 'ASISTENTE_LOGISTICO')
    expect(await screen.findByText('No se encontró la solicitud')).toBeTruthy()
  })

  it('el Asistente Logístico ve «Cotizar» y lleva a Nueva cotización con esa solicitud', async () => {
    vi.spyOn(solicitudesInternasApi, 'detalle').mockResolvedValue(base())
    pintar(99, 'ASISTENTE_LOGISTICO')
    const enlace = await screen.findByRole('link', { name: 'Cotizar' })
    expect(enlace.getAttribute('href')).toBe('/cotizaciones/nueva?solicitud=99')
  })

  it('el Asistente Administrativo solo mira: no ve «Cotizar»', async () => {
    vi.spyOn(solicitudesInternasApi, 'detalle').mockResolvedValue(base())
    pintar(99, 'ASISTENTE_ADMINISTRATIVO')
    await screen.findByText('SOL-2026-99')
    expect(screen.queryByRole('link', { name: 'Cotizar' })).toBeNull()
  })

  it('con cotización creada muestra su código y el enlace para verla, sin «Cotizar»', async () => {
    vi.spyOn(solicitudesInternasApi, 'detalle').mockResolvedValue(base({ idCotizacion: 50, codigoCotizacion: 'COT-2026-50' }))
    pintar(99, 'ASISTENTE_LOGISTICO')
    const enlace = await screen.findByRole('link', { name: /COT-2026-50/ })
    expect(enlace.getAttribute('href')).toBe('/cotizaciones/50')
    expect(screen.queryByRole('link', { name: 'Cotizar' })).toBeNull()
  })

  it('una solicitud ya cotizada no ofrece «Cotizar»', async () => {
    vi.spyOn(solicitudesInternasApi, 'detalle').mockResolvedValue(base({ estado: 'COTIZADA' }))
    pintar(99, 'JEFE_ADMINISTRATIVO')
    await waitFor(() => expect(screen.getByText('Cotizada')).toBeTruthy())
    expect(screen.queryByRole('link', { name: 'Cotizar' })).toBeNull()
  })
})
