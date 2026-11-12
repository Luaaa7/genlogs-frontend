import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, MemoryRouter, Route, RouterProvider, Routes } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import { rutasFeC } from '@/router/rutas/fe-c'
import { RutaSolicitudInterna } from './RutaSolicitudInterna'

function cliente() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

describe('ruta /solicitudes/:id', () => {
  beforeEach(() => useAuthStore.setState({ nombreRol: null }))

  it('permisosDe deja fuera a quien puedeVer(solicitudes) dejaría pasar', () => {
    for (const rol of ['ASISTENTE_ADMINISTRATIVO', 'CLIENTE']) {
      useAuthStore.setState({ nombreRol: rol })
      const { unmount } = render(
        <MemoryRouter initialEntries={['/solicitudes/1']}>
          <Routes>
            <Route element={<RutaSolicitudInterna />}>
              <Route path="/solicitudes/:id" element={<p>panel</p>} />
            </Route>
            <Route path="/dashboard" element={<p>dashboard</p>} />
          </Routes>
        </MemoryRouter>,
      )
      expect(screen.getByText('dashboard')).toBeTruthy()
      unmount()
    }
  })

  it('RoleGuard y permisosDe abren el detalle solo a los tres roles', async () => {
    for (const rol of ['ASISTENTE_LOGISTICO', 'JEFE_ADMINISTRATIVO', 'GERENTE_GENERAL']) {
      useAuthStore.setState({ nombreRol: rol })
      const router = createMemoryRouter([
        ...rutasFeC.internas,
        { path: '/dashboard', element: <p>dashboard</p> },
      ], { initialEntries: ['/solicitudes/1'] })
      const { unmount } = render(
        <QueryClientProvider client={cliente()}>
          <RouterProvider router={router} />
        </QueryClientProvider>,
      )
      expect(await screen.findByText('SOL-001')).toBeTruthy()
      unmount()
    }
  })

  it('RoleGuard manda al dashboard a un rol que no está en la ruta', () => {
    useAuthStore.setState({ nombreRol: 'CONTADOR_GENERAL' })
    const router = createMemoryRouter([
      ...rutasFeC.internas,
      { path: '/dashboard', element: <p>dashboard</p> },
    ], { initialEntries: ['/solicitudes/1'] })
    render(
      <QueryClientProvider client={cliente()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    )
    expect(screen.getByText('dashboard')).toBeTruthy()
  })
})
