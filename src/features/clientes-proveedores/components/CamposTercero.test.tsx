import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
    renderForm()
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByText(/obligatorio/i)).toBeNull()
  })

  it('edición: conserva el número de documento cargado', async () => {
    renderForm({
      defaultValues: {
        tercero: { idTipoDocumento: 1, idDistrito: 5, numeroDocumento: '20512345671', razonSocial: 'Mi Proveedor SAC', direccion: '', telefono: '', correo: '' },
        situacion: 'ACTIVO',
      },
    })
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.getByDisplayValue('20512345671')).toBeTruthy()
    expect(screen.queryByText(/obligatorio/i)).toBeNull()
  })

  it('al cambiar el tipo de documento se limpia el número, sin marcar error', async () => {
    renderForm({
      defaultValues: {
        tercero: { idTipoDocumento: 1, idDistrito: 5, numeroDocumento: '20512345671', razonSocial: 'X SAC', direccion: '', telefono: '', correo: '' },
        situacion: 'ACTIVO',
      },
    })
    const select = screen.getAllByRole('combobox')[0] as HTMLSelectElement
    fireEvent.change(select, { target: { value: '2' } })
    await waitFor(() => expect(screen.queryByDisplayValue('20512345671')).toBeNull())
    expect(screen.queryByText(/obligatorio/i)).toBeNull()
  })
})
