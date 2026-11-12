import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { permisosDe } from '@/lib/permisos'
import { menuFeC } from '@/menu/fe-c'
import { rutasFeC } from '@/router/rutas/fe-c'
import { useAuthStore } from '@/features/auth/store/authStore'
import { formatearFechaCorta } from '@/lib/formatters/fechaLocal'
import { parametrosDeLista, solicitudesInternasApi } from '../api/solicitudesInternasApi'
import { ROLES_PANTALLA } from '../lib/reglasSolicitud'

/** La rehidratación de genlogs-auth llega después del render y pisa el rol. Hay que esperarla. */
async function esperarSesion() {
  if (useAuthStore.persist.hasHydrated()) return
  await new Promise<void>((resolve) => {
    const quitar = useAuthStore.persist.onFinishHydration(() => {
      quitar()
      resolve()
    })
    if (useAuthStore.persist.hasHydrated()) {
      quitar()
      resolve()
    }
  })
}

async function pintar(ruta: string, rol: string) {
  await esperarSesion()
  sessionStorage.removeItem('genlogs-auth')
  useAuthStore.setState({ token: null, nombreUsuario: null, nombreRol: rol })
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
  beforeEach(async () => {
    await esperarSesion()
    sessionStorage.removeItem('genlogs-auth')
    useAuthStore.setState({ token: null, nombreUsuario: null, nombreRol: null })
  })

  afterEach(() => {
    cleanup()
    sessionStorage.removeItem('genlogs-auth')
    useAuthStore.setState({ token: null, nombreUsuario: null, nombreRol: null })
  })

  it('la ruta y el menú aparecen solo para los tres roles', async () => {
    const item = menuFeC.find((opcion) => opcion.path === '/solicitudes')
    expect(menuFeC.some((opcion) => opcion.path === '/despachos')).toBe(true)
    expect(item?.grupo).toBe('Operación')
    expect(item?.label).toBe('Solicitudes')
    for (const rol of ROLES_PANTALLA) {
      expect(item?.visible?.(permisosDe(rol))).toBe(true)
      const vista = await pintar('/solicitudes', rol)
      try {
        expect(await screen.findByRole('link', { name: 'SOL-002' })).toBeTruthy()
      } finally {
        vista.unmount()
      }
    }
    for (const rol of ['ASISTENTE_ADMINISTRATIVO', 'CLIENTE']) {
      expect(item?.visible?.(permisosDe(rol))).toBe(false)
      const vista = await pintar('/solicitudes', rol)
      try {
        expect(screen.getByText('dashboard')).toBeTruthy()
        expect(screen.queryByRole('link', { name: 'SOL-002' })).toBeNull()
      } finally {
        vista.unmount()
      }
    }
  })

  it('los filtros arman page, size, q, estado, tipoPlazo e idAsistente', async () => {
    expect(parametrosDeLista({
      page: 1, size: 20, q: ' aire ', estado: 'PENDIENTE', tipoPlazo: 'IMPORTADO', idAsistente: 7,
    })).toEqual({ page: 1, size: 20, q: 'aire', estado: 'PENDIENTE', tipoPlazo: 'IMPORTADO', idAsistente: 7 })
    const listar = vi.spyOn(solicitudesInternasApi, 'listar')
    const vista = await pintar('/solicitudes', 'JEFE_ADMINISTRATIVO')
    try {
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
    } finally {
      listar.mockRestore()
      vista.unmount()
    }
  })

  it('ordena el mock por vencimiento, con null al final, y la fila aguanta sin semáforo ni fecha', async () => {
    const lista = await solicitudesInternasApi.listar({ page: 0, size: 10 })
    expect(lista.content.map((fila) => fila.codigoSolicitud)).toEqual(['SOL-002', 'SOL-001', 'SOL-004', 'SOL-003', 'SOL-005'])
    expect(lista.content[0]?.semaforo).toBe('VERDE')
    expect(lista.content.find((fila) => fila.codigoSolicitud === 'SOL-003')?.semaforo).toBe('ROJO')
    expect(lista.content[4]?.fechaLimiteInterna).toBeNull()
    expect(lista.content[4]?.semaforo).toBeNull()

    const vista = await pintar('/solicitudes', 'GERENTE_GENERAL')
    try {
      const fila = (await screen.findByRole('link', { name: 'SOL-005' })).closest('tr') as HTMLElement
      expect(within(fila).getByText(formatearFechaCorta(null))).toBeTruthy()
      expect(within(fila).queryByRole('img')).toBeNull()
    } finally {
      vista.unmount()
    }
  })
})
