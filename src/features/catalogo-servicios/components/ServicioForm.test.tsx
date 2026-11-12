import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { EstadoAprobacionServicio } from '@/types/servicio.types'

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))
vi.mock('@/api/axiosClient', () => ({ axiosClient: http }))

import { useAuthStore } from '@/features/auth/store/authStore'
import { RANGO_MARGEN_SERVICIO } from '../hooks/useServicios'
import { ServicioForm } from './ServicioForm'

const PARAMETROS = [
  { clave: 'MARGEN_SERV_MIN', valor: '15', descripcion: null, editadoEn: '2026-11-01T00:00:00' },
  { clave: 'MARGEN_SERV_MAX', valor: '45', descripcion: null, editadoEn: '2026-11-01T00:00:00' },
]

function pintar(props: { idServicio?: number; estadoAprobacion?: EstadoAprobacionServicio | null } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const view = render(
    <QueryClientProvider client={qc}>
      <ServicioForm onSubmit={() => {}} {...props} />
    </QueryClientProvider>,
  )
  return { ...view, qc }
}

describe('precio y margen del servicio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ nombreRol: 'ASISTENTE_LOGISTICO' })
    http.get.mockImplementation((url: string) => {
      if (url === '/parametros') return Promise.resolve({ data: PARAMETROS })
      return Promise.resolve({ data: [] })
    })
    http.post.mockResolvedValue({ data: { idServicio: 7, estadoAprobacion: 'APROBADO' } })
  })

  it('con costo 100 y margen 35 muestra 135.00', async () => {
    pintar()
    fireEvent.change(screen.getByLabelText('Costo'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Margen (%)'), { target: { value: '35' } })
    expect(await screen.findByDisplayValue('135.00')).toBeTruthy()
  })

  it('con precio manual, 200 no lo reemplaza la fórmula', async () => {
    pintar()
    fireEvent.change(screen.getByLabelText('Costo'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Margen (%)'), { target: { value: '35' } })
    await screen.findByDisplayValue('135.00')
    fireEvent.click(screen.getByLabelText('Precio manual'))
    fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '200' } })
    fireEvent.change(screen.getByLabelText('Margen (%)'), { target: { value: '50' } })
    expect((screen.getByLabelText('Precio') as HTMLInputElement).value).toBe('200')
  })

  it('margen 10 avisa que queda pendiente y margen 15 no', async () => {
    pintar()
    fireEvent.change(screen.getByLabelText('Margen (%)'), { target: { value: '10' } })
    expect(await screen.findByText(/quedará pendiente de aprobación/i)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Margen (%)'), { target: { value: '15' } })
    await waitFor(() => expect(screen.queryByText(/quedará pendiente de aprobación/i)).toBeNull())
  })

  it('si los parámetros no cargan, no avisa y el formulario se puede guardar', async () => {
    http.get.mockImplementation((url: string) => {
      if (url === '/parametros') return Promise.reject(new Error('sin parámetros'))
      return Promise.resolve({ data: [] })
    })
    const { qc } = pintar()
    fireEvent.change(screen.getByLabelText('Margen (%)'), { target: { value: '10' } })
    await waitFor(() => expect(qc.getQueryState(RANGO_MARGEN_SERVICIO)?.status).toBe('error'))
    expect(screen.queryByText(/quedará pendiente de aprobación/i)).toBeNull()
    expect((screen.getByRole('button', { name: 'Guardar servicio' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('Aprobar solo aparece para el Jefe Administrativo', () => {
    const pendiente = { idServicio: 7, estadoAprobacion: 'PENDIENTE_APROBACION' as const }
    useAuthStore.setState({ nombreRol: 'JEFE_ADMINISTRATIVO' })
    const jefe = pintar(pendiente)
    expect(screen.getByText('Pendiente de aprobación')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Aprobar' })).toBeTruthy()
    jefe.unmount()

    useAuthStore.setState({ nombreRol: 'ASISTENTE_LOGISTICO' })
    const asistente = pintar(pendiente)
    expect(screen.getByText('Pendiente de aprobación')).toBeTruthy()
    expect(asistente.queryByRole('button', { name: 'Aprobar' })).toBeNull()
    asistente.unmount()

    useAuthStore.setState({ nombreRol: 'GERENTE_GENERAL' })
    const gerente = pintar(pendiente)
    expect(gerente.queryByRole('button', { name: 'Aprobar' })).toBeNull()
  })

  it('al aprobar invalida el servicio', async () => {
    useAuthStore.setState({ nombreRol: 'JEFE_ADMINISTRATIVO' })
    const { qc } = pintar({ idServicio: 7, estadoAprobacion: 'PENDIENTE_APROBACION' })
    const invalidar = vi.spyOn(qc, 'invalidateQueries')
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }))
    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/servicios/7/aprobar'))
    await waitFor(() => expect(invalidar).toHaveBeenCalledWith({ queryKey: ['servicio', 7] }))
  })
})
