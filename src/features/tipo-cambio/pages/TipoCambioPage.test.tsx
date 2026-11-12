import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'

const { obtenerTipoCambio, corregirTipoCambio } = vi.hoisted(() => ({
  obtenerTipoCambio: vi.fn(),
  corregirTipoCambio: vi.fn(),
}))

vi.mock('@/api/tipoCambioApi', () => ({
  obtenerTipoCambio: () => obtenerTipoCambio(),
  corregirTipoCambio: (v: number) => corregirTipoCambio(v),
}))

import { TipoCambioPage } from './TipoCambioPage'

const HOY = { fecha: '2026-11-12', codigoMoneda: 'USD', valor: 3.79, fuente: 'SUNAT', esDeHoy: true }

async function renderPagina(rol = 'JEFE_ADMINISTRATIVO') {
  useAuthStore.getState().login('token', 'usuario', rol)
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await act(async () => {
    render(<QueryClientProvider client={qc}><TipoCambioPage /></QueryClientProvider>)
  })
}

describe('Pantalla de tipo de cambio (RF-86)', () => {
  beforeEach(() => {
    obtenerTipoCambio.mockReset().mockResolvedValue(HOY)
    corregirTipoCambio.mockReset().mockResolvedValue({ ...HOY, valor: 3.8, fuente: 'MANUAL' })
  })

  it('muestra el valor del día con 4 decimales y su fuente', async () => {
    await renderPagina()
    expect(await screen.findByText(/3\.7900/)).toBeTruthy()
    expect(screen.getByText('SUNAT (consulta automática)')).toBeTruthy()
  })

  it('avisa cuando hoy todavía no hay valor y se usa el último', async () => {
    obtenerTipoCambio.mockResolvedValue({ ...HOY, fecha: '2026-11-11', esDeHoy: false })
    await renderPagina()
    expect(await screen.findByText(/se está usando el último guardado/)).toBeTruthy()
  })

  it('sin ningún valor registrado pide escribir el de hoy', async () => {
    obtenerTipoCambio.mockResolvedValue(null)
    await renderPagina()
    expect(await screen.findByText(/Todavía no hay ningún tipo de cambio/)).toBeTruthy()
  })

  it('el Jefe corrige el de hoy (con coma decimal)', async () => {
    await renderPagina()
    const input = await screen.findByLabelText(/tipo de cambio \(S\/ por US\$ 1\)/i)
    fireEvent.change(input, { target: { value: '3,80' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    })
    await waitFor(() => expect(corregirTipoCambio).toHaveBeenCalledWith(3.8))
    expect(await screen.findByText(/Corregido por el Jefe/)).toBeTruthy()
  })

  it('no envía un valor fuera de rango', async () => {
    await renderPagina()
    const input = await screen.findByLabelText(/tipo de cambio \(S\/ por US\$ 1\)/i)
    fireEvent.change(input, { target: { value: '380' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    })
    expect(screen.getByText(/Revisa el valor/)).toBeTruthy()
    expect(corregirTipoCambio).not.toHaveBeenCalled()
  })

  it('sin permiso solo ve el valor', async () => {
    await renderPagina('GERENTE_GENERAL')
    await screen.findByText(/3\.7900/)
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull()
  })
})
