import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { permisosDe } from '@/lib/permisos'
import { menuFeC } from '@/menu/fe-c'
import { rutasFeC } from '@/router/rutas/fe-c'
import { useAuthStore } from '@/features/auth/store/authStore'
import { formatearFechaCorta } from '@/lib/formatters/fechaLocal'
import { parametrosDeLista, solicitudesInternasApi } from '../api/solicitudesInternasApi'
import { ROLES_PANTALLA } from '../lib/reglasSolicitud'

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

describe('lista de solicitudes', () => {
  beforeEach(() => useAuthStore.setState({ nombreRol: null }))

  it('la ruta y el menú aparecen solo para los tres roles', async () => {
    const item = menuFeC.find((opcion) => opcion.path === '/solicitudes')
    expect(menuFeC.some((opcion) => opcion.path === '/despachos')).toBe(true)
    expect(item?.grupo).toBe('Operación')
    expect(item?.label).toBe('Solicitudes')
    for (const rol of ROLES_PANTALLA) {
      expect(item?.visible?.(permisosDe(rol))).toBe(true)
      const vista = pintar('/solicitudes', rol)
      expect(await screen.findByRole('link', { name: 'SOL-002' })).toBeTruthy()
      vista.unmount()
    }
    for (const rol of ['ASISTENTE_ADMINISTRATIVO', 'CLIENTE']) {
      expect(item?.visible?.(permisosDe(rol))).toBe(false)
      const vista = pintar('/solicitudes', rol)
      expect(screen.getByText('dashboard')).toBeTruthy()
      expect(screen.queryByRole('link', { name: 'SOL-002' })).toBeNull()
      vista.unmount()
    }
  })

  it('los filtros arman page, size, q, estado, tipoPlazo e idAsistente', async () => {
    expect(parametrosDeLista({
      page: 1, size: 20, q: ' aire ', estado: 'PENDIENTE', tipoPlazo: 'IMPORTADO', idAsistente: 7,
    })).toEqual({ page: 1, size: 20, q: 'aire', estado: 'PENDIENTE', tipoPlazo: 'IMPORTADO', idAsistente: 7 })
    const listar = vi.spyOn(solicitudesInternasApi, 'listar')
    pintar('/solicitudes', 'JEFE_ADMINISTRATIVO')
    expect(await screen.findByRole('link', { name: 'SOL-002' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'aire' } })
    fireEvent.click(screen.getByRole('button', { name: 'Pendiente' }))
    fireEvent.change(screen.getByLabelText('Plazo'), { target: { value: 'IMPORTADO' } })
    fireEvent.change(screen.getByLabelText('Asistente'), { target: { value: '7' } })
    await waitFor(() => {
      expect(listar).toHaveBeenCalledWith(expect.objectContaining({
        page: 0, size: 10, q: 'aire', estado: 'PENDIENTE', tipoPlazo: 'IMPORTADO', idAsistente: 7,
      }))
    })
    listar.mockRestore()
  })

  it('ordena el mock por vencimiento, con null al final, y la fila aguanta sin semáforo ni fecha', async () => {
    const lista = await solicitudesInternasApi.listar({ page: 0, size: 10 })
    expect(lista.content.map((fila) => fila.codigoSolicitud)).toEqual(['SOL-002', 'SOL-001', 'SOL-004', 'SOL-003', 'SOL-005'])
    expect(lista.content[0]?.semaforo).toBe('VERDE')
    expect(lista.content.find((fila) => fila.codigoSolicitud === 'SOL-003')?.semaforo).toBe('ROJO')
    expect(lista.content[4]?.fechaLimiteInterna).toBeNull()
    expect(lista.content[4]?.semaforo).toBeNull()

    pintar('/solicitudes', 'GERENTE_GENERAL')
    const fila = (await screen.findByRole('link', { name: 'SOL-005' })).closest('tr') as HTMLElement
    expect(within(fila).getByText(formatearFechaCorta(null))).toBeTruthy()
    expect(within(fila).queryByRole('img')).toBeNull()
  })
})
