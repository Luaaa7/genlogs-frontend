import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import axios from 'axios'
import { permisosDe } from '@/lib/permisos'
import { menuFeC } from '@/menu/fe-c'
import { rutasFeC } from '@/router/rutas/fe-c'
import { useAuthStore } from '@/features/auth/store/authStore'
import { ROLES_DESPACHO } from '../lib/reglasDespacho'
import { despachosApi } from '../api/despachosApi'

function pintar(ruta: string, rol: string) {
  useAuthStore.setState({ nombreRol: rol })
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

function filaDe(codigo: string) {
  const fila = screen.getByText(codigo).closest('tr')
  if (!fila) throw new Error(`No está la fila ${codigo}`)
  return fila as HTMLElement
}

describe('despacho', () => {
  beforeEach(() => useAuthStore.setState({ nombreRol: null }))

  it('la ruta y el menú se ven para los cinco roles y no para contador ni cliente', async () => {
    const item = menuFeC.find((opcion) => opcion.path === '/despachos')
    expect(item?.grupo).toBe('Operación')
    expect(item?.label).toBe('Despacho')
    for (const rol of ROLES_DESPACHO) {
      expect(item?.visible?.(permisosDe(rol))).toBe(true)
      const vista = pintar('/despachos', rol)
      expect(await screen.findByText('DES-001')).toBeTruthy()
      vista.unmount()
    }
    for (const rol of ['CONTADOR_GENERAL', 'CLIENTE']) {
      expect(item?.visible?.(permisosDe(rol))).toBe(false)
      const vista = pintar('/despachos', rol)
      expect(screen.getByText('dashboard')).toBeTruthy()
      expect(screen.queryByText('DES-001')).toBeNull()
      vista.unmount()
    }
  })

  it('En aduana solo aparece en el importado, con el plazo tal como llega', async () => {
    const lista = pintar('/despachos', 'GERENTE_GENERAL')
    expect(await screen.findByText('DES-001')).toBeTruthy()
    expect(within(filaDe('DES-001')).queryByText('En aduana')).toBeNull()
    expect(within(filaDe('DES-002')).getByText('En aduana')).toBeTruthy()
    lista.unmount()

    const nacional = pintar('/despachos/1', 'ASISTENTE_ADMINISTRATIVO')
    expect(await screen.findByText(/24–48 h/)).toBeTruthy()
    expect(screen.queryByText('En aduana')).toBeNull()
    nacional.unmount()

    pintar('/despachos/2', 'JEFE_ADMINISTRATIVO')
    expect(await screen.findByText('En aduana')).toBeTruthy()
    expect(screen.getByText(/5–7 días hábiles/)).toBeTruthy()
  })

  it('Avanzar y Dar salida quedan deshabilitados si falta el pase o el SCTR está vencido', async () => {
    const sctr = pintar('/despachos/3', 'ASISTENTE_LOGISTICO')
    expect(await screen.findByText('El SCTR está vencido.')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Avanzar' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Dar salida' }) as HTMLButtonElement).disabled).toBe(true)
    sctr.unmount()

    const pase = pintar('/despachos/4', 'ASISTENTE_LOGISTICO')
    expect(await screen.findByText('Falta el pase.')).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Avanzar' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Dar salida' }) as HTMLButtonElement).disabled).toBe(true)
    pase.unmount()

    pintar('/despachos/3', 'SUPERVISOR_SST')
    expect(await screen.findByRole('button', { name: 'Confirmar pase' })).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Confirmar SCTR' }) as HTMLButtonElement).disabled).toBe(false)
    expect(screen.queryByRole('button', { name: 'Avanzar' })).toBeNull()
  })

  it('muestra el texto de un error que empieza con DESPACHO_BLOQUEADO_SST', async () => {
    const fallo = new axios.AxiosError('Request failed with status code 409')
    fallo.response = {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: { headers: {} } as never,
      data: { message: 'DESPACHO_BLOQUEADO_SST: falta el pase' },
    }
    const espiar = vi.spyOn(despachosApi, 'avanzar').mockRejectedValue(fallo)
    pintar('/despachos/1', 'ASISTENTE_LOGISTICO')
    fireEvent.click(await screen.findByRole('button', { name: 'Avanzar' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('DESPACHO_BLOQUEADO_SST')
    espiar.mockRestore()
  })
})
