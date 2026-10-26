import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/api/distritosApi', async (orig) => ({
  ...(await orig<typeof import('@/api/distritosApi')>()),
  listarDistritos: vi.fn().mockResolvedValue([]),
}))

import { ProveedorForm } from './ProveedorForm'

const renderForm = (props = {}) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ProveedorForm onSubmit={() => {}} {...props} />
    </QueryClientProvider>,
  )
}

describe('CamposTercero: campo de documento', () => {
  it('formulario nuevo: no muestra error sin haber tocado nada', async () => {
    await act(async () => {
      renderForm()
    })
    await waitFor(() => expect(screen.queryByText(/obligatorio/i, { ignore: '.sr-only, script, style' })).toBeNull())
  })

  it('edición: conserva el número de documento cargado', async () => {
    await act(async () => {
      renderForm({
        defaultValues: {
          tercero: { idTipoDocumento: 1, idDistrito: 5, numeroDocumento: '20512345671', razonSocial: 'Mi Proveedor SAC', direccion: '', telefono: '', correo: '' },
          situacion: 'ACTIVO',
        },
      })
    })
    await waitFor(() => expect(screen.getByDisplayValue('20512345671')).toBeTruthy())
    expect(screen.queryByText(/obligatorio/i, { ignore: '.sr-only, script, style' })).toBeNull()
  })

  it('al cambiar el tipo de documento se limpia el número, sin marcar error', async () => {
    await act(async () => {
      renderForm({
        defaultValues: {
          tercero: { idTipoDocumento: 1, idDistrito: 5, numeroDocumento: '20512345671', razonSocial: 'X SAC', direccion: '', telefono: '', correo: '' },
          situacion: 'ACTIVO',
        },
      })
    })
    await waitFor(() => expect(screen.getByDisplayValue('20512345671')).toBeTruthy())
    
    const select = screen.getAllByRole('combobox')[0] as HTMLSelectElement
    await act(async () => {
      fireEvent.change(select, { target: { value: '2' } })
    })
    await waitFor(() => expect(screen.queryByDisplayValue('20512345671')).toBeNull())
    expect(screen.queryByText(/obligatorio/i, { ignore: '.sr-only, script, style' })).toBeNull()
  })
})