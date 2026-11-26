import { describe, expect, it, vi } from 'vitest'
import { axiosClient } from './axiosClient'
import { ordenesCompraApi } from './ordenesCompraApi'

describe('ordenesCompraApi.confirmarOc', () => {
  it('manda al backend los nombres que espera: numeroOc, fechaEmision y monto', async () => {
    const patch = vi.spyOn(axiosClient, 'patch').mockResolvedValueOnce({ data: {} })
    await ordenesCompraApi.confirmarOc(47, {
      numeroOcCliente: 'PRUEBA-001',
      fechaEmisionCliente: '2026-11-26',
      montoOcCliente: 196.66,
    })
    expect(patch).toHaveBeenCalledWith('/ordenes-compra/47/confirmar-oc', {
      numeroOc: 'PRUEBA-001',
      fechaEmision: '2026-11-26',
      monto: 196.66,
    })
  })
})
