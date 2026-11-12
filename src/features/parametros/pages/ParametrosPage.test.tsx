import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store/authStore'

const { PARAMETROS, actualizarParametro, actualizarMargenesRepuesto } = vi.hoisted(() => {
  const p = (clave: string, valor: string) => ({ clave, valor, descripcion: null, editadoEn: '2026-11-10T10:00:00' })
  return {
    actualizarParametro: vi.fn(),
    actualizarMargenesRepuesto: vi.fn(),
    PARAMETROS: [
      p('MONTO_ALTO_VALOR_PEN', '20000'),
      p('MARGEN_SERV_MIN', '15'), p('MARGEN_SERV_SUGERIDO', '25'), p('MARGEN_SERV_AVISO', '35'), p('MARGEN_SERV_MAX', '45'),
      p('MARGEN_REP_MIN', '15'), p('MARGEN_REP_DEFAULT', '25'), p('MARGEN_REP_MAX', '45'),
      p('PLAZO_COMUN_DIAS', '1'), p('PLAZO_IMPORTADO_DIAS', '3'), p('PLAZO_ESPECIAL_DIAS', '5'), p('ALERTA_PLAZO_PCT', '75'),
      p('VERIFICACION_DIAS', '15'), p('OCULTAR_SIN_VERIF_DIAS', '60'), p('OCULTAR_FALLAS', '2'),
    ],
  }
})

vi.mock('@/api/parametrosApi', () => ({
  listarParametros: vi.fn().mockResolvedValue(PARAMETROS),
  actualizarParametro: (c: string, v: string) => actualizarParametro(c, v),
  actualizarMargenesRepuesto: (m: unknown) => actualizarMargenesRepuesto(m),
}))

import { ParametrosPage } from './ParametrosPage'

async function renderPagina(rol: string) {
  useAuthStore.getState().login('token', 'usuario', rol)
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  await act(async () => {
    render(<QueryClientProvider client={qc}><ParametrosPage /></QueryClientProvider>)
  })
  await screen.findByLabelText('Monto de alto valor')
}

const grupo = (titulo: string) => screen.getByRole('form', { name: titulo })

describe('Pantalla de parámetros (RF-87)', () => {
  beforeEach(() => {
    actualizarParametro.mockReset().mockResolvedValue({})
    actualizarMargenesRepuesto.mockReset().mockResolvedValue([])
  })

  it('muestra los grupos con sus valores y el horario hábil', async () => {
    await renderPagina('JEFE_ADMINISTRATIVO')
    expect((screen.getByLabelText('Monto de alto valor') as HTMLInputElement).value).toBe('20000')
    expect(within(grupo('Plazos de respuesta')).getByLabelText('Común nacional')).toBeTruthy()
    expect(screen.getByText('08:00 a 13:00')).toBeTruthy()
  })

  it('el Jefe guarda solo lo que cambió', async () => {
    await renderPagina('JEFE_ADMINISTRATIVO')
    const plazos = grupo('Plazos de respuesta')
    fireEvent.change(within(plazos).getByLabelText('Importado o poco común'), { target: { value: '4' } })
    await act(async () => {
      fireEvent.click(within(plazos).getByRole('button', { name: 'Guardar' }))
    })
    await waitFor(() => expect(actualizarParametro).toHaveBeenCalledTimes(1))
    expect(actualizarParametro).toHaveBeenCalledWith('PLAZO_IMPORTADO_DIAS', '4')
  })

  it('los márgenes de repuestos se guardan los tres juntos', async () => {
    await renderPagina('JEFE_ADMINISTRATIVO')
    const repuestos = grupo('Márgenes de repuestos')
    fireEvent.change(within(repuestos).getByLabelText('Máximo'), { target: { value: '50' } })
    await act(async () => {
      fireEvent.click(within(repuestos).getByRole('button', { name: 'Guardar' }))
    })
    await waitFor(() => expect(actualizarMargenesRepuesto).toHaveBeenCalledWith({ min: 15, porDefecto: 25, max: 50 }))
    expect(actualizarParametro).not.toHaveBeenCalled()
  })

  it('no guarda márgenes fuera de orden', async () => {
    await renderPagina('JEFE_ADMINISTRATIVO')
    const servicios = grupo('Márgenes de servicios')
    fireEvent.change(within(servicios).getByLabelText('Mínimo'), { target: { value: '30' } })
    await act(async () => {
      fireEvent.click(within(servicios).getByRole('button', { name: 'Guardar' }))
    })
    expect(within(servicios).getByText(/mínimo ≤ sugerido/)).toBeTruthy()
    expect(actualizarParametro).not.toHaveBeenCalled()
  })

  it('sin permiso de edición los campos son de solo lectura y no hay botón Guardar', async () => {
    await renderPagina('GERENTE_GENERAL')
    expect((screen.getByLabelText('Monto de alto valor') as HTMLInputElement).readOnly).toBe(true)
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull()
  })
})
