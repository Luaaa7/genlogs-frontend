/**
 * FE-A (test/fe-a-roles): menú lateral y rutas con cada uno de los 7 roles de la v3.2.
 * Matriz: "GENLOGS — Procesos, roles e impacto en la BD (v3.2)", sección Roles y matriz,
 * y FE-A: /usuarios y /configuracion/* solo para JEFE_ADMINISTRATIVO.
 *
 * Usa el AppLayout real (menú) y las rutas reales del router (las de src/router/index.tsx
 * y las de cada bloque en src/router/rutas/fe-x.tsx). Las llamadas al backend quedan
 * pendientes: aquí solo importa qué ve y a dónde entra cada rol.
 *
 * Diferencias con la matriz que este test NO cubre todavía (al corregirlas, agregar el caso):
 *  - Menú "Cotizaciones" y ruta /cotizaciones: el Contador y el Supervisor SST la ven (AppLayout usa
 *    verCotizacionesYOrdenes, que también da true con Pedidos y OC). La matriz no les da cotizaciones.
 *  - Menú "Comprobantes" (/facturacion): el Supervisor SST y el Asistente Logístico la ven; la matriz no.
 *  - Menú "Solicitudes" (FE-C): el Asistente Administrativo no la ve y /solicitudes lo manda al
 *    dashboard; la matriz le da "solo ve".
 *  - Menú "PASE y SCTR por vencer" (FE-E): la ven el SST y el Asistente Logístico; la matriz de
 *    Documentos es Gerente y Jefe (ven), Contador, SST y Asistente Administrativo (editan).
 *  - Empresas mineras, Repuestos y Servicios: el menú sigue la matriz, pero sus rutas no tienen
 *    RoleGuard y un rol sin acceso entra escribiendo la URL (el backend sí bloquea).
 *  - Búsqueda y Vitrina (FE-D) quedan fuera: dependen de sus interruptores.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { RouteObject } from 'react-router-dom'

// Se toma la lista de rutas que arma src/router/index.tsx, sin tocar ese archivo.
const capturadas = vi.hoisted(() => ({ rutas: [] as RouteObject[] }))
vi.mock('react-router-dom', async (orig) => {
  const real = await orig<typeof import('react-router-dom')>()
  return {
    ...real,
    createBrowserRouter: (rutas: RouteObject[]) => {
      capturadas.rutas = rutas
      return real.createMemoryRouter(rutas)
    },
  }
})
// Sin backend: cada llamada queda pendiente, así las pantallas no fallan ni redirigen por un 401.
vi.mock('@/api/axiosClient', () => {
  const pendiente = () => new Promise(() => {})
  const cliente = {
    get: pendiente, post: pendiente, put: pendiente, patch: pendiente, delete: pendiente,
    defaults: { baseURL: '' },
    interceptors: { request: { use: () => 0 }, response: { use: () => 0 } },
  }
  return { axiosClient: cliente, http: cliente }
})

import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { AppLayout } from '@/layouts/AppLayout'
import { ROLES, ROLES_INTERNOS, type Rol } from '@/lib/permisos'
import '@/router'

type Interno = Exclude<Rol, 'CLIENTE'>
const GG = 'GERENTE_GENERAL', JA = 'JEFE_ADMINISTRATIVO', CG = 'CONTADOR_GENERAL', SST = 'SUPERVISOR_SST'
const AL = 'ASISTENTE_LOGISTICO', AA = 'ASISTENTE_ADMINISTRATIVO'
const TODOS_INTERNOS: Interno[] = [GG, JA, CG, SST, AL, AA]

/** Opción del menú → roles internos que la ven (matriz v3.2 / FE-A). */
const MENU_ESPERADO: Record<string, Interno[]> = {
  Dashboard: TODOS_INTERNOS,
  'Órdenes de compra': TODOS_INTERNOS,
  Reclamos: [GG, JA, AL, AA],
  Despacho: [GG, JA, SST, AL, AA],
  'Acciones correctivas': [GG, JA, CG, AL],
  'Empresas mineras': [GG, JA, AL, AA],
  Repuestos: [GG, JA, AL, AA],
  Servicios: [GG, JA, AL, AA],
  Usuarios: [JA],
  IGV: [JA],
  Márgenes: [JA],
  Parámetros: [JA],
  'Tipo de cambio': [JA],
}

/** Ruta interna → roles internos que entran; el resto vuelve al dashboard. */
const RUTAS_ESPERADAS: Record<string, Interno[]> = {
  '/dashboard': TODOS_INTERNOS,
  '/ordenes-compra': TODOS_INTERNOS,
  '/reclamos': [GG, JA, AL, AA],
  '/despachos': [GG, JA, SST, AL, AA],
  '/acciones': [GG, JA, CG, AL],
  '/usuarios': [JA],
  '/configuracion/igv': [JA],
  '/configuracion/margenes': [JA],
  '/configuracion/parametros': [JA],
  '/configuracion/tipo-cambio': [JA],
}

function sesionInterna(rol: string) {
  localStorage.clear()
  sessionStorage.clear()
  localStorage.setItem('access_token', 'token')
  useAuthStore.getState().login('token', 'usuario', rol)
}

function sesionCliente() {
  useAuthStore.getState().logout()
  localStorage.clear()
  sessionStorage.clear()
  localStorage.setItem('cliente_access_token', 'token')
  sessionStorage.setItem('genlogs-cliente-auth', JSON.stringify({ nombre: 'Cliente', rol: 'CLIENTE' }))
}

async function opcionesDelMenu(rol: string): Promise<string[]> {
  sesionInterna(rol)
  await act(async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppLayout />
        </MemoryRouter>
      </QueryClientProvider>,
    )
  })
  const menu = screen.getAllByRole('navigation', { name: 'Módulos' })[0]
  return Array.from(menu.querySelectorAll('a')).map((a) => a.textContent?.trim() ?? '')
}

/** Abre la ruta con el router real y devuelve dónde terminó (tras las redirecciones). */
async function terminaEn(ruta: string): Promise<string> {
  const router = createMemoryRouter(capturadas.rutas, { initialEntries: [ruta] })
  await act(async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )
  })
  await waitFor(() => expect(router.state.navigation.state).toBe('idle'))
  return router.state.location.pathname
}

afterEach(() => {
  cleanup()
  useAuthStore.getState().logout()
  localStorage.clear()
  sessionStorage.clear()
})

describe('los 7 roles de la v3.2', () => {
  it('permisos.ts tiene exactamente los 7 roles y 6 son internos', () => {
    expect([...ROLES].sort()).toEqual([GG, JA, CG, SST, AL, AA, 'CLIENTE'].sort())
    expect([...ROLES_INTERNOS].sort()).toEqual([...TODOS_INTERNOS].sort())
  })
})

describe('menú lateral con cada rol', () => {
  it.each(TODOS_INTERNOS)('%s ve solo las opciones que le da la matriz', async (rol) => {
    const opciones = await opcionesDelMenu(rol)
    for (const [opcion, roles] of Object.entries(MENU_ESPERADO)) {
      expect(opciones.includes(opcion), `${rol} ${roles.includes(rol) ? 'debería' : 'NO debería'} ver "${opcion}"`)
        .toBe(roles.includes(rol))
    }
  }, 20_000)

  it('un usuario de la base sin migrar (ADMINISTRADOR) ve el menú del Jefe Administrativo', async () => {
    const opciones = await opcionesDelMenu('ADMINISTRADOR')
    expect(opciones).toEqual(expect.arrayContaining(['Usuarios', 'IGV', 'Márgenes', 'Parámetros', 'Tipo de cambio']))
  }, 20_000)
})

describe('rutas con cada rol', () => {
  it.each(TODOS_INTERNOS)('%s entra solo a las rutas que le da la matriz', async (rol) => {
    for (const [ruta, roles] of Object.entries(RUTAS_ESPERADAS)) {
      sesionInterna(rol)
      const destino = await terminaEn(ruta)
      cleanup()
      const esperado = roles.includes(rol) ? ruta : '/dashboard'
      expect(destino, `${rol} en ${ruta} debería terminar en ${esperado}`).toBe(esperado)
    }
  }, 60_000)

  it('el cliente no entra a las rutas internas: lo manda al login', async () => {
    for (const ruta of Object.keys(RUTAS_ESPERADAS)) {
      sesionCliente()
      const destino = await terminaEn(ruta)
      cleanup()
      expect(destino, `CLIENTE en ${ruta}`).toBe('/login')
    }
  }, 60_000)

  it('el portal es del cliente: el personal interno va al ingreso del cliente', async () => {
    for (const rol of TODOS_INTERNOS) {
      sesionInterna(rol)
      const destino = await terminaEn('/portal/pedidos')
      cleanup()
      expect(destino, `${rol} en /portal/pedidos`).toBe('/portal/ingreso')
    }
    sesionCliente()
    expect(await terminaEn('/portal/pedidos')).toBe('/portal/pedidos')
  }, 60_000)

  it('sin sesión, una ruta interna manda al login', async () => {
    localStorage.clear()
    sessionStorage.clear()
    expect(await terminaEn('/usuarios')).toBe('/login')
  }, 20_000)
})
