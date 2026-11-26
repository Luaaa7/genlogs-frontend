import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./axiosClient', () => ({ axiosClient: { post: vi.fn() } }))

import { axiosClient } from './axiosClient'
import { probarSesion } from './fuentesApi'

describe('probarSesion', () => {
  beforeEach(() => vi.clearAllMocks())

  it('espera más que el límite global de 60 s: el lector abre un navegador', async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({ data: { codigo: 'AMAZON' } })

    const fuente = await probarSesion('AMAZON')

    expect(fuente).toEqual({ codigo: 'AMAZON' })
    expect(axiosClient.post).toHaveBeenCalledWith('/fuentes/AMAZON/probar', undefined, { timeout: 130_000 })
  })
})
