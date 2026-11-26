import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

const api = vi.hoisted(() => ({ listarUsuarios: vi.fn() }))
vi.mock('@/api/usuariosApi', () => api)

import { useAsignables } from './useAsignables'

const USUARIOS = [
  { idUsuario: 7, nombreUsuario: 'alopez', nombres: 'Ana López', correo: 'ana@genlogs.pe', nombreRol: 'ASISTENTE_LOGISTICO', bloqueado: false },
  { idUsuario: 3, nombreUsuario: 'jperez', nombres: 'Juan Pérez', correo: 'juan@genlogs.pe', nombreRol: 'JEFE_ADMINISTRATIVO', bloqueado: false },
  { idUsuario: 8, nombreUsuario: 'mora', nombres: 'Luis Mora', correo: 'luis@genlogs.pe', nombreRol: 'ASISTENTE_LOGISTICO', bloqueado: true },
  { idUsuario: 4, nombreUsuario: 'conta', nombres: 'Carmen Conta', correo: 'carmen@genlogs.pe', nombreRol: 'CONTADOR_GENERAL', bloqueado: false },
]

function envoltorio() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
}

describe('useAsignables', () => {
  beforeEach(() => {
    api.listarUsuarios.mockReset()
    api.listarUsuarios.mockResolvedValue(USUARIOS)
  })

  it('inactivo: no pide nada al servidor', () => {
    const { result } = renderHook(() => useAsignables(false), { wrapper: envoltorio() })
    expect(api.listarUsuarios).not.toHaveBeenCalled()
    expect(result.current.usuarios).toEqual([])
    expect(result.current.cargando).toBe(false)
  })

  it('activo: lee el personal real y deja solo asistentes logísticos y jefes activos', async () => {
    const { result } = renderHook(() => useAsignables(true), { wrapper: envoltorio() })
    await waitFor(() => expect(result.current.usuarios.map((u) => u.nombres)).toEqual(['Ana López', 'Juan Pérez']))
    expect(api.listarUsuarios).toHaveBeenCalledTimes(1)
    expect(result.current.error).toBeNull()
  })

  it('si el servidor responde 403 explica que no hay permiso y no inventa usuarios', async () => {
    const error = new axios.AxiosError('no')
    error.response = { status: 403, data: {}, statusText: 'Forbidden', headers: {}, config: {} as never }
    api.listarUsuarios.mockRejectedValue(error)
    const { result } = renderHook(() => useAsignables(true), { wrapper: envoltorio() })
    await waitFor(() => expect(result.current.error).toBe('No tienes permiso para ver al personal interno.'))
    expect(result.current.usuarios).toEqual([])
  })
})
