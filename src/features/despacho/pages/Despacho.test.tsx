import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { permisosDe } from '@/lib/permisos'
import { menuFeC } from '@/menu/fe-c'
import { rutasFeC } from '@/router/rutas/fe-c'
import { useAuthStore } from '@/features/auth/store/authStore'
import { OrdenesCompraPage } from '@/features/ordenes-compra/pages/OrdenesCompraPage'
import { MisDespachosPage } from '@/features/portal-cliente/pages/MisDespachosPage'
import { formatearFechaCorta } from '@/lib/formatters/fechaLocal'
import { ROLES_DESPACHO } from '../lib/reglasDespacho'
import type { Despacho } from '../api/despachoTipos'

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/api/axiosClient', () => ({ axiosClient: http }))

function despacho(parcial: Partial<Despacho> & Pick<Despacho, 'idDespacho' | 'numeroOrdenCompra' | 'origen' | 'etapa' | 'etapaNombre'>): Despacho {
  return {
    idOrdenCompra: parcial.idDespacho,
    plazoDesde: '2026-11-16T08:00:00',
    plazoHasta: '2026-11-18T08:00:00',
    origenIncompleto: false,
    sst: { bloqueaAvance: false, mensaje: null },
    ...parcial,
  }
}

const nacional = despacho({
  idDespacho: 1,
  numeroOrdenCompra: '0031-10',
  origen: 'NACIONAL',
  etapa: 'EN_PREPARACION',
  etapaNombre: 'En preparación',
  origenIncompleto: true,
})

const importado = despacho({
  idDespacho: 2,
  numeroOrdenCompra: '0032-10',
  origen: 'IMPORTADO',
  etapa: 'EN_ADUANA',
  etapaNombre: 'En aduana',
  plazoDesde: '2026-11-20T08:00:00',
  plazoHasta: '2026-11-27T08:00:00',
})

const bloqueado = despacho({
  idDespacho: 3,
  numeroOrdenCompra: '0033-10',
  origen: 'IMPORTADO',
  etapa: 'EN_TRANSITO',
  etapaNombre: 'En tránsito',
  sst: { bloqueaAvance: true, mensaje: 'Falta el pase vigente.' },
})

function pintar(ruta: string, rol: string) {
  useAuthStore.setState({ nombreRol: rol, token: 't', nombreUsuario: rol })
  const router = createMemoryRouter([
    ...rutasFeC.internas,
    { path: '/dashboard', element: <p>dashboard</p> },
  ], { initialEntries: [ruta] })
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={cliente}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

function pintarSuelto(ui: ReactNode, rol: string) {
  useAuthStore.setState({ nombreRol: rol, token: 't', nombreUsuario: rol })
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

function filaDe(codigo: string) {
  const fila = screen.getByText(codigo).closest('tr')
  if (!fila) throw new Error(`No está la fila ${codigo}`)
  return fila as HTMLElement
}

describe('despacho', () => {
  beforeEach(() => {
    useAuthStore.setState({ nombreRol: null })
    http.get.mockImplementation((url: string) => {
      if (url === '/despachos') return Promise.resolve({ data: [nacional, importado, bloqueado] })
      if (url === '/despachos/1') return Promise.resolve({ data: nacional })
      if (url === '/despachos/2') return Promise.resolve({ data: importado })
      if (url === '/despachos/3') return Promise.resolve({ data: bloqueado })
      if (url === '/portal/despachos') {
        return Promise.resolve({ data: [{
          id: 4,
          etapa: 'EN_TRANSITO',
          etapaNombre: 'En tránsito',
          plazoDesde: '2026-11-16T08:00:00',
          plazoHasta: '2026-11-20T08:00:00',
          numeroOrdenCompra: '0031-10',
          sst: { mensaje: 'Falta el pase vigente.', bloqueaAvance: true },
          origenIncompleto: true,
          idUsuario: 9,
          usuario: 'ana.logistica',
        }] })
      }
      return Promise.resolve({ data: [] })
    })
    http.post.mockReset()
    http.patch.mockReset()
    http.patch.mockResolvedValue({ data: nacional })
  })

  it('la ruta y el menú se ven para los cinco roles y no para contador ni cliente', async () => {
    const item = menuFeC.find((opcion) => opcion.path === '/despachos')
    expect(item?.grupo).toBe('Operación')
    expect(item?.label).toBe('Despacho')
    for (const rol of ROLES_DESPACHO) {
      expect(item?.visible?.(permisosDe(rol))).toBe(true)
      const vista = pintar('/despachos', rol)
      expect(await screen.findByText('0031-10')).toBeTruthy()
      vista.unmount()
    }
    for (const rol of ['CONTADOR_GENERAL', 'CLIENTE']) {
      expect(item?.visible?.(permisosDe(rol))).toBe(false)
      const vista = pintar('/despachos', rol)
      expect(screen.getByText('dashboard')).toBeTruthy()
      expect(screen.queryByText('0031-10')).toBeNull()
      vista.unmount()
    }
  })

  it('un nacional no ofrece aduana y el plazo llega desde y hasta', async () => {
    const lista = pintar('/despachos', 'GERENTE_GENERAL')
    expect(await screen.findByText('0031-10')).toBeTruthy()
    expect(within(filaDe('0031-10')).queryByText('En aduana')).toBeNull()
    expect(within(filaDe('0031-10')).getByText('Falta el origen de algún ítem')).toBeTruthy()
    expect(within(filaDe('0032-10')).getByText('En aduana')).toBeTruthy()
    lista.unmount()

    const detalle = pintar('/despachos/1', 'ASISTENTE_LOGISTICO')
    expect(await screen.findByText(`${formatearFechaCorta('2026-11-16T08:00:00')} – ${formatearFechaCorta('2026-11-18T08:00:00')}`, { exact: false })).toBeTruthy()
    expect(screen.getByText('Falta el origen de algún ítem')).toBeTruthy()
    expect(screen.queryByText('En aduana')).toBeNull()
    expect(screen.queryByText(/24–48|días hábiles/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Avanzar a En tránsito' }))
    await waitFor(() => expect(http.patch).toHaveBeenCalledWith('/despachos/1/etapa', { etapa: 'EN_TRANSITO' }))
    detalle.unmount()

    pintar('/despachos/2', 'JEFE_ADMINISTRATIVO')
    expect(await screen.findByText('En aduana')).toBeTruthy()
    expect(screen.getByText(`${formatearFechaCorta('2026-11-20T08:00:00')} – ${formatearFechaCorta('2026-11-27T08:00:00')}`, { exact: false })).toBeTruthy()
  })

  it('el avance queda deshabilitado cuando SST bloquea y se muestra su mensaje', async () => {
    pintar('/despachos/3', 'ASISTENTE_LOGISTICO')
    expect(await screen.findByText('Falta el pase vigente.')).toBeTruthy()
    const avanzar = screen.getByRole('button', { name: 'Avanzar a Entregado' }) as HTMLButtonElement
    expect(avanzar.disabled).toBe(true)
    fireEvent.click(avanzar)
    expect(http.patch).not.toHaveBeenCalled()
  })

  it('si el API rechaza el alta, muestra su mensaje y no crea otro', async () => {
    const fallo = new axios.AxiosError('Request failed with status code 400')
    fallo.response = {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: {} } as never,
      data: { message: 'Confirma la OC de la minera antes de registrar el despacho.' },
    }
    http.post.mockRejectedValueOnce(fallo)
    pintarSuelto(<OrdenesCompraPage />, 'ASISTENTE_LOGISTICO')
    const fila = (await screen.findByText('OC-001')).closest('tr') as HTMLElement
    const boton = within(fila).getByRole('button', { name: 'Registrar despacho' })
    fireEvent.click(boton)
    expect(await screen.findByText('Confirma la OC de la minera antes de registrar el despacho.')).toBeTruthy()
    expect(http.post).toHaveBeenCalledTimes(1)
    expect(http.post).toHaveBeenCalledWith('/despachos', { idOrdenCompra: 1 })
    expect((boton as HTMLButtonElement).disabled).toBe(false)

    http.post.mockResolvedValueOnce({ data: { idDespacho: 9, numeroOrdenCompra: 'OC-001' } })
    fireEvent.click(boton)
    await waitFor(() => expect(http.post).toHaveBeenCalledTimes(2))
  })

  it('el portal muestra la etapa, el plazo y la orden, sin SST ni origen ni usuarios', async () => {
    pintarSuelto(<MisDespachosPage />, 'CLIENTE')
    expect(await screen.findByText('En tránsito')).toBeTruthy()
    expect(screen.getByText('Orden 0031-10')).toBeTruthy()
    expect(screen.getByText(`${formatearFechaCorta('2026-11-16T08:00:00')} – ${formatearFechaCorta('2026-11-20T08:00:00')}`, { exact: false })).toBeTruthy()
    expect(http.get).toHaveBeenCalledWith('/portal/despachos')
    expect(screen.queryByText('Falta el pase vigente.')).toBeNull()
    expect(screen.queryByText('Falta el origen de algún ítem')).toBeNull()
    expect(screen.queryByText('ana.logistica')).toBeNull()
  })
})
