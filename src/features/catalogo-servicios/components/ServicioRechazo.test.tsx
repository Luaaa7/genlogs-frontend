import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError, type AxiosResponse } from 'axios'
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
import { margenDePrecio } from '../lib/precioServicio'
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

function error403(mensaje: string) {
  return new AxiosError('Request failed with status code 403', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 403,
    data: { message: mensaje },
  } as AxiosResponse)
}

describe('rechazo del servicio y margen real con precio manual', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ nombreRol: 'JEFE_ADMINISTRATIVO' })
    http.get.mockImplementation((url: string) => {
      if (url === '/parametros') return Promise.resolve({ data: PARAMETROS })
      return Promise.resolve({ data: [] })
    })
    http.post.mockResolvedValue({ data: { idServicio: 7, estadoAprobacion: 'RECHAZADO' } })
  })

  it('el Jefe ve Rechazar y al pulsarlo llama al backend e invalida el servicio', async () => {
    const { qc } = pintar({ idServicio: 7, estadoAprobacion: 'PENDIENTE_APROBACION' })
    const invalidar = vi.spyOn(qc, 'invalidateQueries')

    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))

    await waitFor(() => expect(http.post).toHaveBeenCalledWith('/servicios/7/rechazar'))
    await waitFor(() => expect(invalidar).toHaveBeenCalledWith({ queryKey: ['servicio', 7] }))
  })

  it('quien no es Jefe no ve Rechazar', () => {
    useAuthStore.setState({ nombreRol: 'ASISTENTE_LOGISTICO' })
    pintar({ idServicio: 7, estadoAprobacion: 'PENDIENTE_APROBACION' })

    expect(screen.queryByRole('button', { name: 'Rechazar' })).toBeNull()
  })

  it('si el backend no deja autoaprobar, muestra su mensaje', async () => {
    http.post.mockRejectedValue(error403('No puedes aprobar ni rechazar un servicio que registraste o editaste tú'))
    pintar({ idServicio: 7, estadoAprobacion: 'PENDIENTE_APROBACION' })

    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }))

    expect(await screen.findByText(/que registraste o editaste tú/)).toBeTruthy()
  })

  it('un servicio rechazado lo dice y no muestra botones', () => {
    pintar({ idServicio: 7, estadoAprobacion: 'RECHAZADO' })

    expect(screen.getByText(/Rechazado por el Jefe Administrativo/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Aprobar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Rechazar' })).toBeNull()
  })

  it('con precio manual muestra el margen real y avisa con ese margen', async () => {
    useAuthStore.setState({ nombreRol: 'ASISTENTE_LOGISTICO' })
    pintar()
    fireEvent.change(screen.getByLabelText('Costo'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Margen (%)'), { target: { value: '30' } })
    await screen.findByDisplayValue('130.00')
    fireEvent.click(screen.getByLabelText('Precio manual'))
    fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '150' } })

    expect(await screen.findByText('Margen real con este precio: 50.00 %')).toBeTruthy()
    expect(screen.getByText(/quedará pendiente de aprobación/i)).toBeTruthy()
  })

  it('un precio manual menor que el costo se señala', async () => {
    useAuthStore.setState({ nombreRol: 'ASISTENTE_LOGISTICO' })
    pintar()
    fireEvent.change(screen.getByLabelText('Costo'), { target: { value: '100' } })
    fireEvent.click(screen.getByLabelText('Precio manual'))
    fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '90' } })

    expect(await screen.findByText('El precio no puede ser menor que el costo.')).toBeTruthy()
  })

  it('margenDePrecio sigue la fórmula del backend', () => {
    expect(margenDePrecio(1000, 1250)).toBe(25)
    expect(margenDePrecio(300, 400)).toBe(33.33)
    expect(margenDePrecio(100, 90)).toBe(-10)
  })
})
