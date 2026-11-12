import { describe, expect, it } from 'vitest'
import type { NotificacionResponse } from '@/api/contratos'
import { avisoAltoValorDe } from './avisoAltoValor'

function aviso(parcial: Partial<NotificacionResponse>): NotificacionResponse {
  return {
    idNotificacion: 1,
    tipo: 'ALTO_VALOR',
    titulo: 'Cotización de alto valor',
    mensaje: 'Revisala.',
    enlace: '/cotizaciones/1',
    leida: false,
    fechaCreacion: '2026-11-11T10:00:00',
    ...parcial,
  }
}

describe('avisoAltoValorDe', () => {
  it('toma el aviso solo si es de alto valor y el enlace es esta cotización', () => {
    const propio = aviso({})
    expect(avisoAltoValorDe(1, [])).toBeNull()
    expect(avisoAltoValorDe(1, [aviso({ enlace: '/cotizaciones/2' })])).toBeNull()
    expect(avisoAltoValorDe(1, [aviso({ tipo: 'GENERAL' })])).toBeNull()
    expect(avisoAltoValorDe(1, [aviso({ enlace: null })])).toBeNull()
    expect(avisoAltoValorDe(1, [propio])).toBe(propio)
    expect(avisoAltoValorDe(1, [aviso({ enlace: '/cotizaciones/1/' })])?.titulo).toBe('Cotización de alto valor')
  })
})
