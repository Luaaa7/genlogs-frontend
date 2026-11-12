import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const { DISTRITOS, PAISES } = vi.hoisted(() => ({
  DISTRITOS: [
    { idDistrito: 10, nombreDistrito: 'NAZCA', ubigeo: '110301', nombreProvincia: 'NAZCA', nombreDepartamento: 'ICA' },
    { idDistrito: 99, nombreDistrito: 'EXTRANJERO', ubigeo: '900101', nombreProvincia: 'EXTRANJERO', nombreDepartamento: 'EXTRANJERO' },
  ],
  PAISES: [
    { idPais: 1, codigoIso: 'PE', nombrePais: 'Perú' },
    { idPais: 7, codigoIso: 'CL', nombrePais: 'Chile' },
  ],
}))

vi.mock('@/api/distritosApi', async (orig) => ({
  ...(await orig<typeof import('@/api/distritosApi')>()),
  listarDistritos: vi.fn().mockResolvedValue(DISTRITOS),
}))
vi.mock('@/api/paisesApi', async (orig) => ({
  ...(await orig<typeof import('@/api/paisesApi')>()),
  listarPaises: vi.fn().mockResolvedValue(PAISES),
}))

import { ProveedorForm } from './ProveedorForm'

function renderForm(onSubmit = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={qc}>
      <ProveedorForm onSubmit={onSubmit} />
    </QueryClientProvider>,
  )
  return onSubmit
}

async function llenarRuc() {
  fireEvent.change(screen.getByLabelText(/número de ruc/i), { target: { value: '20512345671' } })
  fireEvent.change(screen.getByLabelText(/razón social/i), { target: { value: 'Minera Andina SAC' } })
}

describe('País y ubicación del tercero (D-15)', () => {
  it('empieza en Perú con los selects en cascada y sin la opción vieja "Extranjero"', async () => {
    await act(async () => {
      renderForm()
    })
    await waitFor(() => expect((screen.getByLabelText(/^país/i) as HTMLSelectElement).value).toBe('1'))
    const departamentos = Array.from((screen.getByLabelText(/departamento/i) as HTMLSelectElement).options).map((o) => o.textContent)
    expect(departamentos).toContain('ICA')
    expect(departamentos).not.toContain('EXTRANJERO')
    expect(screen.queryByLabelText(/^ciudad/i)).toBeNull()
  })

  it('fuera de Perú pide región, ciudad y código postal y envía el país sin distrito', async () => {
    const onSubmit = await act(async () => renderForm())
    await waitFor(() => expect((screen.getByLabelText(/^país/i) as HTMLSelectElement).options.length).toBe(2))

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/^país/i), { target: { value: '7' } })
    })
    expect(screen.queryByLabelText(/departamento/i)).toBeNull()
    expect(screen.getByLabelText(/región o estado/i)).toBeTruthy()
    expect(screen.getByLabelText(/código postal/i)).toBeTruthy()

    await llenarRuc()
    // Sin ciudad no se guarda.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /guardar proveedor/i }))
    })
    expect(await screen.findByText('Escribe la ciudad')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/región o estado/i), { target: { value: 'Antofagasta' } })
    fireEvent.change(screen.getByLabelText(/^ciudad/i), { target: { value: 'Calama' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /guardar proveedor/i }))
    })
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    const enviado = onSubmit.mock.calls[0][0].tercero
    expect(enviado.idPais).toBe(7)
    expect(enviado.idDistrito).toBeUndefined()
    expect(enviado.ciudadExtranjero).toBe('Calama')
    expect(enviado.regionExtranjero).toBe('Antofagasta')
    expect(enviado).not.toHaveProperty('esExtranjero')
  })
})
