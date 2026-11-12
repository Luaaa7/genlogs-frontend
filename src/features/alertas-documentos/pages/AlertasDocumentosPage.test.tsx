import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))
vi.mock('@/api/axiosClient', () => ({ axiosClient: http }))

import { AlertasDocumentosPage } from './AlertasDocumentosPage'
import { ordenarAlertas, tramoDe } from '../lib/alertas'

const aviso = (id: number, tipo: string, titulo: string, leida: boolean, fecha: string) => ({
  idNotificacion: id,
  tipo,
  titulo,
  mensaje: 'Faltan días. Renuévalo antes de que bloquee el despacho.',
  enlace: '/ordenes-compra',
  leida,
  fechaCreacion: fecha,
})

const AVISOS = {
  noLeidas: 3,
  avisos: [
    aviso(1, 'DOCUMENTO_POR_VENCER', 'PASE del despacho #4 vence el 12/12/2026 (aviso de 30 días)', false, '2026-11-12T07:30:00'),
    aviso(2, 'ALTO_VALOR', 'Cotización de alto valor', false, '2026-11-12T08:00:00'),
    aviso(3, 'DOCUMENTO_POR_VENCER', 'SCTR del despacho #9 vence el 15/11/2026 (aviso de 7 días)', false, '2026-11-11T07:30:00'),
    aviso(4, 'DOCUMENTO_POR_VENCER', 'PASE del despacho #2 vence el 20/11/2026 (aviso de 15 días)', true, '2026-11-05T07:30:00'),
  ],
}

function pintar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AlertasDocumentosPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PASE y SCTR por vencer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    http.get.mockResolvedValue({ data: AVISOS })
    http.patch.mockResolvedValue({ data: undefined })
  })

  it('muestra solo los avisos de documentos, sin leer y más urgentes primero', async () => {
    pintar()

    const filas = await screen.findAllByRole('listitem')
    expect(http.get).toHaveBeenCalledWith('/notificaciones')
    expect(filas).toHaveLength(3)
    expect(screen.queryByText('Cotización de alto valor')).toBeNull()
    expect(within(filas[0]).getByText(/SCTR del despacho #9/)).toBeTruthy()
    expect(within(filas[1]).getByText(/PASE del despacho #4/)).toBeTruthy()
    expect(within(filas[2]).getByText(/PASE del despacho #2/)).toBeTruthy()
    expect(screen.getByText('2 avisos sin leer')).toBeTruthy()
  })

  it('marcar como leído llama a la campanita y vuelve a cargar', async () => {
    pintar()
    const filas = await screen.findAllByRole('listitem')

    fireEvent.click(within(filas[0]).getByRole('button', { name: 'Marcar como leído' }))

    await waitFor(() => expect(http.patch).toHaveBeenCalledWith('/notificaciones/3/leida'))
    await waitFor(() => expect(http.get).toHaveBeenCalledTimes(2))
  })

  it('un aviso leído no ofrece marcarlo otra vez y lleva a órdenes de compra', async () => {
    pintar()
    const filas = await screen.findAllByRole('listitem')

    expect(within(filas[2]).queryByRole('button', { name: 'Marcar como leído' })).toBeNull()
    expect(within(filas[2]).getByRole('link', { name: 'Ver órdenes de compra' }).getAttribute('href')).toBe('/ordenes-compra')
  })

  it('sin avisos de documentos muestra el estado vacío', async () => {
    http.get.mockResolvedValue({ data: { noLeidas: 0, avisos: [AVISOS.avisos[1]] } })
    pintar()

    expect(await screen.findByText('No hay PASE ni SCTR por vencer')).toBeTruthy()
  })

  it('si falla la carga lo dice', async () => {
    http.get.mockRejectedValue(new Error('caído'))
    pintar()

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudieron cargar los avisos')
  })

  it('lee el tramo del título y ordena', () => {
    expect(tramoDe('SCTR del despacho #9 vence el 15/11/2026 (aviso de 7 días)')).toBe(7)
    expect(tramoDe('Otro aviso')).toBeNull()
    const ordenadas = ordenarAlertas(AVISOS.avisos.filter((a) => a.tipo === 'DOCUMENTO_POR_VENCER'))
    expect(ordenadas.map((a) => a.idNotificacion)).toEqual([3, 1, 4])
  })
})
