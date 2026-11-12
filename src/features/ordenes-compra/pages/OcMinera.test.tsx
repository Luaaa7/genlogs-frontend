import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/store/authStore'
import type { OrdenCompra } from '@/types/ordenCompra.types'
import { OcMineraForm } from '../components/OcMineraForm'
import { OrdenesCompraPage } from './OrdenesCompraPage'

function orden(parcial: Partial<OrdenCompra> = {}): OrdenCompra {
  return {
    idOrdenCompra: 1,
    idCotizacion: 9,
    idEstadoOrdenCompra: 1,
    idCondicionPago: 1,
    numeroOrdenCompra: 'OC-001',
    fechaRecepcion: '2026-11-01',
    total: 1180,
    moneda: 'PEN',
    ...parcial,
  }
}

function pintarForm(parcial: Partial<OrdenCompra>, onConfirmar = vi.fn()) {
  return {
    onConfirmar,
    ...render(<OcMineraForm orden={orden(parcial)} puedeEditar onConfirmar={onConfirmar} />),
  }
}

function pintarLista(rol: string) {
  useAuthStore.setState({ nombreRol: rol })
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter>
        <OrdenesCompraPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OC de la minera', () => {
  beforeEach(() => {
    useAuthStore.setState({ nombreRol: null })
  })

  it('rechaza el número vacío y un monto que no es numérico', async () => {
    const onConfirmar = vi.fn()
    pintarForm({ numeroOcCliente: '', montoOcCliente: null, fechaEmisionCliente: '' }, onConfirmar)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByText('Indica el N.º de OC de la minera.')).toBeTruthy()
    expect(onConfirmar).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/N.º de OC de la minera/), { target: { value: 'MIN-9' } })
    fireEvent.change(screen.getByLabelText(/Fecha de emisión/), { target: { value: '2026-11-03' } })
    fireEvent.change(screen.getByLabelText(/^Monto/), { target: { value: 'abc' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByText('El monto debe ser numérico.')).toBeTruthy()
    expect(onConfirmar).not.toHaveBeenCalled()
  })

  it('avisa solo cuando el monto leído y el total difieren', () => {
    const distinto = pintarForm({ numeroOcCliente: 'MIN-200', montoOcCliente: 1500, total: 1180, fechaEmisionCliente: '2026-11-02' })
    expect(screen.getByText(/no coincide con el total/)).toBeTruthy()
    const detalle = screen.getByText(/Total de la cotización/).textContent ?? ''
    expect(detalle).toContain('1,500.00')
    expect(detalle).toContain('1,180.00')
    distinto.unmount()

    const igual = pintarForm({ numeroOcCliente: 'MIN-100', montoOcCliente: 1180, total: 1180, fechaEmisionCliente: '2026-11-01' })
    expect(screen.queryByText(/no coincide con el total/)).toBeNull()
    igual.unmount()

    pintarForm({ numeroOcCliente: null, montoOcCliente: null, total: 800 })
    expect(screen.queryByText(/no coincide con el total/)).toBeNull()
  })

  it('Confirmar solo lo ve el asistente administrativo, y la fila aguanta sin número de la minera', async () => {
    const asistente = pintarLista('ASISTENTE_ADMINISTRATIVO')
    expect(await screen.findByText('OC-003')).toBeTruthy()
    const filaVacia = screen.getByText('OC-003').closest('tr')
    expect(filaVacia).toBeTruthy()
    expect(within(filaVacia as HTMLElement).queryByText(/OC minera/)).toBeNull()
    expect(screen.getByText('OC minera MIN-100')).toBeTruthy()

    const fila = screen.getByText('OC-001').closest('tr') as HTMLElement
    fireEvent.click(within(fila).getByRole('button', { name: 'OC de la minera' }))
    expect(await screen.findByRole('button', { name: 'Confirmar' })).toBeTruthy()
    expect(screen.getByLabelText(/PDF de la OC/)).toBeTruthy()
    asistente.unmount()

    pintarLista('JEFE_ADMINISTRATIVO')
    const filaJefe = (await screen.findByText('OC-001')).closest('tr') as HTMLElement
    fireEvent.click(within(filaJefe).getByRole('button', { name: 'OC de la minera' }))
    expect(await screen.findByText('MIN-100')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Confirmar' })).toBeNull()
    expect(screen.queryByLabelText(/PDF de la OC/)).toBeNull()
  })
})
