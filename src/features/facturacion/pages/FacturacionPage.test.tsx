import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import type { Factura } from '@/types/facturacion.types'

const api = vi.hoisted(() => ({ listar: vi.fn() }))
vi.mock('@/api/facturacionApi', () => ({ facturacionApi: api }))

import { useAuthStore } from '@/features/auth/store/authStore'
import { FacturacionPage } from './FacturacionPage'

function factura(over: Partial<Factura>): Factura {
  return {
    idFacturacion: 1,
    idOrdenCompra: 10,
    idTipoComprobante: 1,
    idEstadoFacturacion: 1,
    idCondicionPago: 1,
    idMoneda: 1,
    serieComprobante: 'F001',
    numeroComprobante: '1',
    codigoComprobante: 'F001-1',
    fechaEmision: '2026-11-01',
    fechaVencimiento: '2026-12-01',
    montoPagado: 0,
    total: 100,
    numeroOrdenCompra: 'OC-001',
    estadoCodigo: 'EMITIDA',
    ...over,
  }
}

function pintar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <FacturacionPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('OC minera en la lista de facturación', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ nombreRol: 'CONTADOR_GENERAL' })
    api.listar.mockResolvedValue({
      content: [
        factura({ idFacturacion: 1, codigoComprobante: 'F001-1', numeroOrdenCompra: 'OC-001', numeroOcCliente: 'MIN-100' }),
        factura({ idFacturacion: 2, codigoComprobante: 'F001-2', numeroOrdenCompra: 'OC-002', numeroOcCliente: null }),
      ],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 20,
    })
  })

  it('muestra el N.º de la minera solo cuando viene, y deja visible el número interno', async () => {
    pintar()

    const conOc = (await screen.findByText('F001-1')).closest('tr')
    const sinOc = screen.getByText('F001-2').closest('tr')
    expect(conOc).toBeTruthy()
    expect(sinOc).toBeTruthy()

    expect(within(conOc as HTMLElement).getByText('OC minera MIN-100')).toBeTruthy()
    expect(within(conOc as HTMLElement).getByText('Orden OC-001')).toBeTruthy()

    expect(within(sinOc as HTMLElement).queryByText(/OC minera/)).toBeNull()
    expect(within(sinOc as HTMLElement).getByText('Orden OC-002')).toBeTruthy()
  })
})
