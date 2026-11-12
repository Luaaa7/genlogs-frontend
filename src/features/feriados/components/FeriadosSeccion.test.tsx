import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'
import { manana } from '../lib/fechasFeriado'

const { listarFeriados, crearFeriado, quitarFeriado } = vi.hoisted(() => ({
  listarFeriados: vi.fn(),
  crearFeriado: vi.fn(),
  quitarFeriado: vi.fn(),
}))

vi.mock('@/api/feriadosApi', () => ({
  listarFeriados: () => listarFeriados(),
  crearFeriado: (f: unknown) => crearFeriado(f),
  quitarFeriado: (id: number) => quitarFeriado(id),
}))

import { FeriadosSeccion } from './FeriadosSeccion'

const FUTURO = '2099-07-28'

async function renderSeccion(rol: string) {
  useAuthStore.getState().login('token', 'usuario', rol)
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await act(async () => {
    render(<QueryClientProvider client={qc}><FeriadosSeccion /></QueryClientProvider>)
  })
}

describe('Feriados dentro de Parámetros (D-18)', () => {
  beforeEach(() => {
    listarFeriados.mockReset().mockResolvedValue([
      { idFeriado: 2, fecha: FUTURO, descripcion: 'Fiestas Patrias' },
      { idFeriado: 1, fecha: '2099-01-01', descripcion: 'Año Nuevo' },
    ])
    crearFeriado.mockReset().mockResolvedValue({ idFeriado: 3, fecha: '2099-12-08', descripcion: 'Inmaculada' })
    quitarFeriado.mockReset().mockResolvedValue(undefined)
  })

  it('lista los feriados ordenados por fecha', async () => {
    await renderSeccion('JEFE_ADMINISTRATIVO')
    const items = await screen.findAllByRole('listitem')
    expect(items[0].textContent).toContain('Año Nuevo')
    expect(items[1].textContent).toContain('Fiestas Patrias')
  })

  it('el Jefe agrega un feriado futuro', async () => {
    await renderSeccion('JEFE_ADMINISTRATIVO')
    await screen.findByText('Año Nuevo')
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2099-12-08' } })
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: '  Inmaculada  ' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Agregar' }))
    })
    await waitFor(() => expect(crearFeriado).toHaveBeenCalledWith({ fecha: '2099-12-08', descripcion: 'Inmaculada' }))
    expect((screen.getByLabelText('Fecha') as HTMLInputElement).min).toBe(manana())
  })

  it('no deja repetir una fecha ni agregar sin motivo', async () => {
    await renderSeccion('JEFE_ADMINISTRATIVO')
    await screen.findByText('Año Nuevo')
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: FUTURO } })
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'Otra vez' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Agregar' }))
    })
    expect(screen.getByText(/Ya hay un feriado/)).toBeTruthy()
    expect(crearFeriado).not.toHaveBeenCalled()
  })

  it('el Jefe quita un feriado futuro tras confirmar', async () => {
    await renderSeccion('JEFE_ADMINISTRATIVO')
    await screen.findByText('Fiestas Patrias')
    fireEvent.click(screen.getByRole('button', { name: /quitar el feriado del .*28 de julio/i }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Quitar' }))
    })
    await waitFor(() => expect(quitarFeriado).toHaveBeenCalledWith(2))
  })

  it('sin permiso solo ve la lista', async () => {
    await renderSeccion('GERENTE_GENERAL')
    await screen.findByText('Fiestas Patrias')
    expect(screen.queryByRole('form', { name: 'Agregar feriado' })).toBeNull()
    expect(screen.queryByRole('button', { name: /quitar/i })).toBeNull()
  })
})
