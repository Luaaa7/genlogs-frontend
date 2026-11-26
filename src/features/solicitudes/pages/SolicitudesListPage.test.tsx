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

const api = vi.hoisted(() => ({ listarUsuarios: vi.fn() }))
vi.mock('@/api/usuariosApi', () => api)

const USUARIOS = [
  { idUsuario: 7, nombreUsuario: 'alopez', nombres: 'Ana López', correo: 'ana@genlogs.pe', nombreRol: 'ASISTENTE_LOGISTICO', bloqueado: false },
  { idUsuario: 3, nombreUsuario: 'jperez', nombres: 'Juan Pérez', correo: 'juan@genlogs.pe', nombreRol: 'JEFE_ADMINISTRATIVO', bloqueado: false },
  { idUsuario: 8, nombreUsuario: 'mora', nombres: 'Luis Mora', correo: 'luis@genlogs.pe', nombreRol: 'ASISTENTE_LOGISTICO', bloqueado: true },
  { idUsuario: 4, nombreUsuario: 'conta', nombres: 'Carmen Conta', correo: 'carmen@genlogs.pe', nombreRol: 'CONTADOR_GENERAL', bloqueado: false },
]

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
    api.listarUsuarios.mockReset()
    api.listarUsuarios.mockResolvedValue(USUARIOS)
    await esperarSesion()
    sessionStorage.removeItem('genlogs-auth')
    useAuthStore.setState({ token: null, nombreUsuario: null, nombreRol: null })
  })

  afterEach(() => {
    cleanup()
    sessionStorage.removeItem('genlogs-auth')
    useAuthStore.setState({ token: null, nombreUsuario: null, nombreRol: null })
  })

  it('la ruta y el menú aparecen para los cuatro roles de la matriz y no para Contador, SST ni Cliente', async () => {
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
    for (const rol of ['CONTADOR_GENERAL', 'SUPERVISOR_SST', 'CLIENTE']) {
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
      await screen.findByRole('option', { name: 'Ana López' })
      fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'aire' } })
      fireEvent.click(screen.getByRole('button', { name: 'Recibida' }))
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

  it('ordena el mock por hora de recepción (la última primero), y la fila aguanta sin semáforo ni fecha', async () => {
    const lista = await solicitudesInternasApi.listar({ page: 0, size: 10 })
    expect(lista.content.map((fila) => fila.codigoSolicitud)).toEqual(['SOL-001', 'SOL-002', 'SOL-003', 'SOL-004', 'SOL-005'])
    expect(lista.content[0]?.semaforo).toBe('AMARILLO')
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

  describe('datos reales del personal y estados', () => {
    it('los chips de estado solo ofrecen los tres estados abiertos', async () => {
      const vista = await pintar('/solicitudes', 'JEFE_ADMINISTRATIVO')
      try {
        const grupo = await screen.findByRole('group', { name: 'Filtrar por estado' })
        expect(within(grupo).getAllByRole('button').map((b) => b.textContent)).toEqual(['Todas', 'Recibida', 'En búsqueda', 'En espera de proveedor'])
        expect(within(grupo).queryByRole('button', { name: 'Cotizada' })).toBeNull()
        expect(within(grupo).queryByRole('button', { name: 'Rechazada' })).toBeNull()
        expect(within(grupo).queryByRole('button', { name: 'Cancelada' })).toBeNull()
      } finally {
        vista.unmount()
      }
    })

    it('el Jefe elige entre el personal real, sin usuarios de ejemplo ni bloqueados', async () => {
      const vista = await pintar('/solicitudes', 'JEFE_ADMINISTRATIVO')
      try {
        await screen.findByRole('option', { name: 'Ana López' })
        expect(api.listarUsuarios).toHaveBeenCalledTimes(1)
        const select = screen.getByLabelText('Asistente')
        expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['Todos', 'Sin asignar', 'Ana López', 'Juan Pérez'])
      } finally {
        vista.unmount()
      }
    })

    it('el Gerente también ve el personal, igual que GET /usuarios', async () => {
      const vista = await pintar('/solicitudes', 'GERENTE_GENERAL')
      try {
        expect(await screen.findByRole('option', { name: 'Ana López' })).toBeTruthy()
      } finally {
        vista.unmount()
      }
    })

    it('el Asistente Logístico no pide el personal (daría 403) pero sí puede filtrar Sin asignar', async () => {
      const vista = await pintar('/solicitudes', 'ASISTENTE_LOGISTICO')
      try {
        expect(await screen.findByRole('link', { name: 'SOL-002' })).toBeTruthy()
        expect(api.listarUsuarios).not.toHaveBeenCalled()
        const select = screen.getByLabelText('Asistente')
        expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['Todos', 'Sin asignar'])
      } finally {
        vista.unmount()
      }
    })

    it('«Sin asignar» deja solo las solicitudes que nadie atiende todavía', async () => {
      const listar = vi.spyOn(solicitudesInternasApi, 'listar')
      const vista = await pintar('/solicitudes', 'JEFE_ADMINISTRATIVO')
      try {
        expect(await screen.findByRole('link', { name: 'SOL-002' })).toBeTruthy()
        fireEvent.change(screen.getByLabelText('Asistente'), { target: { value: 'sin' } })
        expect(await screen.findByRole('link', { name: 'SOL-001' })).toBeTruthy()
        expect(screen.queryByRole('link', { name: 'SOL-002' })).toBeNull()
        expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ sinAsignar: true, idAsistente: undefined }))

        fireEvent.change(screen.getByLabelText('Asistente'), { target: { value: '7' } })
        expect(await screen.findByRole('link', { name: 'SOL-002' })).toBeTruthy()
        expect(screen.queryByRole('link', { name: 'SOL-001' })).toBeNull()
        expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ idAsistente: 7, sinAsignar: undefined }))
      } finally {
        listar.mockRestore()
        vista.unmount()
      }
    })

    it('el Asistente Administrativo consulta la lista como pide la matriz (V)', async () => {
      const vista = await pintar('/solicitudes', 'ASISTENTE_ADMINISTRATIVO')
      try {
        expect(await screen.findByRole('link', { name: 'SOL-002' })).toBeTruthy()
        expect(screen.queryByText('dashboard')).toBeNull()
      } finally {
        vista.unmount()
      }
    })
  })
})
