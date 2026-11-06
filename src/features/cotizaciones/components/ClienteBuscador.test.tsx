import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Cliente } from '@/types/cliente.types'
import { ClienteBuscador } from './ClienteBuscador'

const cliente = (id: number, tipo: string, numero: string, nombre: string) =>
  ({ idCliente: id, tercero: { idTercero: id, numeroDocumento: numero, razonSocial: nombre, tipoDocumento: tipo, status: 'A' } }) as unknown as Cliente

const clientes = [
  cliente(1, 'RUC', '20512345671', 'MINERA ANDINA S.A.C.'),
  cliente(2, 'DNI', '45678912', 'ANA LOPEZ RUIZ'),
  cliente(3, 'PAS', 'AB123456', 'JOHN SMITH'),
]

function montar() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ClienteBuscador id="cliente" clientes={clientes} onChange={vi.fn()} />
    </QueryClientProvider>,
  )
  return screen.getByRole('combobox')
}

describe('ClienteBuscador: pestañas RUC, DNI y Pasaporte', () => {
  it('no ofrece carné de extranjería y empieza en RUC', () => {
    montar()
    const pestanas = screen.getAllByRole('tab')
    expect(pestanas).toHaveLength(3)
    expect(pestanas.map((t) => t.textContent)).toEqual([
      expect.stringMatching(/^RUC/),
      expect.stringMatching(/^DNI/),
      expect.stringMatching(/^Pasaporte/),
    ])
    expect(screen.getByRole('tab', { name: /^RUC/ }).getAttribute('aria-selected')).toBe('true')
    // Cada pestaña cambia la sección completa: título y botón propios.
    expect(screen.getByText('Empresa con RUC')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: /^Pasaporte/ }))
    expect(screen.getByText('Cliente extranjero con pasaporte')).toBeTruthy()
    expect(screen.getByRole('button', { name: /nuevo extranjero/i })).toBeTruthy()
  })

  it('cada pestaña solo busca clientes de su tipo', () => {
    const campo = montar()
    fireEvent.change(campo, { target: { value: 'a' } })
    expect(screen.getByText('MINERA ANDINA S.A.C.')).toBeTruthy()
    expect(screen.queryByText('ANA LOPEZ RUIZ')).toBeNull()

    fireEvent.click(screen.getByRole('tab', { name: /^DNI/ }))
    fireEvent.change(campo, { target: { value: 'a' } })
    expect(screen.getByText('ANA LOPEZ RUIZ')).toBeTruthy()
    expect(screen.queryByText('MINERA ANDINA S.A.C.')).toBeNull()
  })

  it('pasaporte acepta letras y ofrece registrarlo si no existe', () => {
    const campo = montar()
    fireEvent.click(screen.getByRole('tab', { name: /^Pasaporte/ }))
    fireEvent.change(campo, { target: { value: 'ab123456' } })
    expect(screen.getByText('JOHN SMITH')).toBeTruthy()

    fireEvent.change(campo, { target: { value: 'XY987654' } })
    expect(screen.getByText(/no hay ningún cliente con pasaporte XY987654/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /registrar como cliente nuevo/i })).toBeTruthy()
  })
})