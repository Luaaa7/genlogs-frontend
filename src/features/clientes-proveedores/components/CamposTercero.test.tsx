import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const { DISTRITOS, consultarDocumento } = vi.hoisted(() => ({
  consultarDocumento: vi.fn(),
  DISTRITOS: [
  { idDistrito: 10, nombreDistrito: 'ICA', ubigeo: '110101', nombreProvincia: 'ICA', nombreDepartamento: 'ICA' },
  { idDistrito: 11, nombreDistrito: 'PARCONA', ubigeo: '110108', nombreProvincia: 'ICA', nombreDepartamento: 'ICA' },
  { idDistrito: 20, nombreDistrito: 'MIRAFLORES', ubigeo: '150122', nombreProvincia: 'LIMA', nombreDepartamento: 'LIMA' },
  ],
}))

vi.mock('@/api/distritosApi', async (orig) => ({
  ...(await orig<typeof import('@/api/distritosApi')>()),
  listarDistritos: vi.fn().mockResolvedValue(DISTRITOS),
}))

vi.mock('@/api/tercerosApi', () => ({ tercerosApi: { consultarDocumento: (n: string) => consultarDocumento(n) } }))

import { ProveedorForm } from './ProveedorForm'
import { ClienteForm } from './ClienteForm'

const renderForm = (props = {}) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ProveedorForm onSubmit={() => {}} {...props} />
    </QueryClientProvider>,
  )
}

const valor = (label: RegExp) => (screen.getByLabelText(label) as HTMLInputElement | HTMLSelectElement).value

describe('CamposTercero: pestañas RUC, DNI y Pasaporte', () => {
  beforeEach(() => consultarDocumento.mockReset())

  it('formulario nuevo: empieza en RUC y no muestra errores sin tocar nada', async () => {
    await act(async () => {
      renderForm()
    })
    expect(screen.getByRole('tab', { name: /^RUC/ }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByLabelText(/razón social/i)).toBeTruthy()
    await waitFor(() => expect(screen.queryByText(/obligatorio/i, { ignore: '.sr-only, script, style' })).toBeNull())
  })

  it('edición: conserva el número de documento cargado', async () => {
    await act(async () => {
      renderForm({
        defaultValues: {
          tercero: { idTipoDocumento: 1, idDistrito: 10, numeroDocumento: '20512345671', razonSocial: 'Mi Proveedor SAC', direccion: '', telefono: '', correo: '' },
          situacion: 'ACTIVO',
        },
      })
    })
    await waitFor(() => expect(screen.getByDisplayValue('20512345671')).toBeTruthy())
    // El distrito guardado se muestra en sus tres casillas.
    await waitFor(() => expect(valor(/^distrito/i)).toBe('10'))
    expect(valor(/departamento/i)).toBe('ICA')
    expect(valor(/provincia/i)).toBe('ICA')
  })

  it('DNI y pasaporte piden nombres, apellido paterno y apellido materno por separado (los tres obligatorios)', async () => {
    await act(async () => {
      renderForm()
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /^DNI/ }))
    })
    expect(screen.queryByLabelText(/razón social/i)).toBeNull()
    expect(screen.getByLabelText(/^nombres/i)).toBeTruthy()
    expect(screen.getByLabelText(/apellido paterno/i)).toBeTruthy()
    expect(screen.getByLabelText(/apellido materno/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /consultar reniec/i })).toBeTruthy()

    // Sin apellido materno no se puede guardar.
    fireEvent.change(screen.getByLabelText(/número de dni/i), { target: { value: '45678912' } })
    fireEvent.change(screen.getByLabelText(/^nombres/i), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText(/apellido paterno/i), { target: { value: 'López' } })
    await waitFor(() => expect(screen.getByRole('option', { name: 'ICA' })).toBeTruthy())
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/departamento/i), { target: { value: 'ICA' } })
    })
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/provincia/i), { target: { value: 'ICA' } })
    })
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/^distrito/i), { target: { value: '10' } })
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /guardar proveedor/i }))
    })
    expect(await screen.findByText('Ingresa el apellido materno')).toBeTruthy()

    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /^Pasaporte/ }))
    })
    expect(screen.getByLabelText(/apellido paterno/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /consultar/i })).toBeNull()
  })

  it('al cambiar de pestaña se limpia el número, sin marcar error', async () => {
    await act(async () => {
      renderForm({
        defaultValues: {
          tercero: { idTipoDocumento: 1, idDistrito: 10, numeroDocumento: '20512345671', razonSocial: 'X SAC', direccion: '', telefono: '', correo: '' },
          situacion: 'ACTIVO',
        },
      })
    })
    await waitFor(() => expect(screen.getByDisplayValue('20512345671')).toBeTruthy())
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /^DNI/ }))
    })
    await waitFor(() => expect(screen.queryByDisplayValue('20512345671')).toBeNull())
    expect(screen.queryByText(/obligatorio/i, { ignore: '.sr-only, script, style' })).toBeNull()
  })

  it('al pasar por RUC, DNI y pasaporte se vacían los datos de la identificación anterior', async () => {
    await act(async () => {
      renderForm()
    })
    const escribir = (nombre: RegExp, valor: string) => {
      fireEvent.change(screen.getByLabelText(nombre), { target: { value: valor } })
    }

    escribir(/número de ruc/i, '20512345671')
    escribir(/razón social/i, 'Empresa SAC')
    escribir(/^dirección/i, 'Av. Principal 100')
    escribir(/^teléfono/i, '999888777')
    escribir(/^correo/i, 'compras@empresa.pe')
    await waitFor(() => expect(valor(/^distrito/i)).toBe(''))
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/departamento/i), { target: { value: 'ICA' } })
    })
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/provincia/i), { target: { value: 'ICA' } })
    })
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/^distrito/i), { target: { value: '10' } })
    })

    for (const pestana of [/^DNI/, /^Pasaporte/, /^RUC/]) {
      await act(async () => {
        fireEvent.click(screen.getByRole('tab', { name: pestana }))
      })
      expect(valor(/^número de/i)).toBe('')
      expect(valor(/^dirección/i)).toBe('')
      expect(valor(/^teléfono/i)).toBe('')
      expect(valor(/^correo/i)).toBe('')
      expect(valor(/^distrito/i)).toBe('')
      expect(valor(/departamento/i)).toBe('')
      if (pestana.source === '^RUC') expect(valor(/razón social/i)).toBe('')
      else expect(valor(/^nombres/i)).toBe('')
    }
    expect(screen.queryByDisplayValue('Empresa SAC')).toBeNull()
  })

  it('RENIEC llena las casillas y todas se pueden editar, incluida la ubicación', async () => {
    consultarDocumento.mockResolvedValue({
      numeroDocumento: '45678912', tipoDocumento: 'DNI', razonSocial: 'ANA MARIA LOPEZ RUIZ',
      nombres: 'ANA MARIA', apellidoPaterno: 'LOPEZ', apellidoMaterno: 'RUIZ',
      direccion: 'AV. LOS ANGELES 123', ubigeo: '110101', idDistrito: 10, simulado: false,
    })
    await act(async () => {
      renderForm()
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /^DNI/ }))
    })
    fireEvent.change(screen.getByLabelText(/número de dni/i), { target: { value: '45678912' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /consultar reniec/i }))
    })

    await waitFor(() => expect(valor(/^nombres/i)).toBe('ANA MARIA'))
    expect(valor(/apellido paterno/i)).toBe('LOPEZ')
    expect(valor(/apellido materno/i)).toBe('RUIZ')
    expect(valor(/^dirección/i)).toBe('AV. LOS ANGELES 123')
    expect(valor(/^distrito/i)).toBe('10')
    expect(screen.getByText(/datos completados desde reniec/i)).toBeTruthy()

    // Se puede corregir el apellido y cambiar el distrito.
    fireEvent.change(screen.getByLabelText(/apellido materno/i), { target: { value: 'RUIZ DE CASTILLA' } })
    expect(valor(/apellido materno/i)).toBe('RUIZ DE CASTILLA')
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/^distrito/i), { target: { value: '11' } })
    })
    expect(valor(/^distrito/i)).toBe('11')

    // Al cambiar el departamento se vacían la provincia y el distrito para elegirlos de nuevo.
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/departamento/i), { target: { value: 'LIMA' } })
    })
    expect(valor(/provincia/i)).toBe('')
    expect(valor(/^distrito/i)).toBe('')
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/provincia/i), { target: { value: 'LIMA' } })
    })
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/^distrito/i), { target: { value: '20' } })
    })
    expect(valor(/^distrito/i)).toBe('20')
  })

  it('si se borra o cambia el DNI consultado, se vacían los nombres, apellidos y la ubicación', async () => {
    consultarDocumento.mockResolvedValue({
      numeroDocumento: '41234567', tipoDocumento: 'DNI', razonSocial: 'ANA MARIA LOPEZ RUIZ',
      nombres: 'ANA MARIA', apellidoPaterno: 'LOPEZ', apellidoMaterno: 'RUIZ',
      direccion: 'AV. LOS ANGELES 123', ubigeo: '110101', idDistrito: 10, origen: 'REGISTRADO', simulado: false,
    })
    await act(async () => {
      renderForm()
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /^DNI/ }))
    })
    fireEvent.change(screen.getByLabelText(/número de dni/i), { target: { value: '41234567' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /consultar reniec/i }))
    })
    await waitFor(() => expect(valor(/^nombres/i)).toBe('ANA MARIA'))
    expect(screen.getByText(/ya está registrado en GENLOGS/i)).toBeTruthy()

    // Se borra un dígito: la ficha queda en blanco.
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/número de dni/i), { target: { value: '4123456' } })
    })
    expect(valor(/^nombres/i)).toBe('')
    expect(valor(/apellido paterno/i)).toBe('')
    expect(valor(/apellido materno/i)).toBe('')
    expect(valor(/^dirección/i)).toBe('')
    expect(valor(/^distrito/i)).toBe('')
    expect(valor(/departamento/i)).toBe('')
    expect(screen.queryByText(/ya está registrado en GENLOGS/i)).toBeNull()
  })

  it('abierto desde la pestaña DNI solo muestra la página del DNI, sin pestañas ni clasificación', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    await act(async () => {
      render(
        <QueryClientProvider client={qc}>
          <ClienteForm onSubmit={() => {}} tipoFijo={2} valoresIniciales={{ tercero: { idTipoDocumento: 2 } } as never} />
        </QueryClientProvider>,
      )
    })
    expect(screen.queryAllByRole('tab')).toHaveLength(0)
    expect(screen.getByText('Persona natural con DNI')).toBeTruthy()
    expect(screen.getByLabelText(/número de dni/i)).toBeTruthy()
    expect(screen.queryByLabelText(/razón social/i)).toBeNull()
    expect(screen.queryByText(/clasificación/i)).toBeNull()
    expect(screen.queryByLabelText(/sector económico/i)).toBeNull()
  })

  it('al guardar un DNI arma la razón social con los nombres y apellidos', async () => {
    const onSubmit = vi.fn()
    await act(async () => {
      renderForm({
        onSubmit,
        defaultValues: {
          tercero: {
            idTipoDocumento: 2, idDistrito: 10, numeroDocumento: '45678912', razonSocial: '',
            nombres: ' Ana  María ', apellidoPaterno: 'López', apellidoMaterno: 'Ruiz', direccion: '', telefono: '', correo: '',
          },
          situacion: 'ACTIVO',
        },
      })
    })
    await waitFor(() => expect(valor(/^distrito/i)).toBe('10'))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /guardar proveedor/i }))
    })
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    const enviado = onSubmit.mock.calls[0][0].tercero
    expect(enviado.razonSocial).toBe('Ana María López Ruiz')
    expect(enviado.nombres).toBe('Ana María')
    expect(enviado.apellidoPaterno).toBe('López')
  })
})
