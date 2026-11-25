import { describe, expect, it } from 'vitest'
import type { SolicitudInternaResponse } from '@/api/contratos/solicitudes'
import { listaDeVencimiento, type FilaVencimiento } from './solicitudesInternasApi'

function fila(id: number, extra: Partial<SolicitudInternaResponse> = {}, semaforo: FilaVencimiento['semaforo'] = 'VERDE'): FilaVencimiento {
  return {
    semaforo,
    solicitud: {
      idSolicitud: id, codigoSolicitud: `SOL-00${id}`, asunto: `Asunto ${id}`, cliente: 'Minera Sur', estado: 'PENDIENTE',
      tipoPlazo: 'COMUN', fechaRecepcion: '2026-11-24T09:00:00', fechaLimiteInterna: '2026-11-27T18:00:00',
      pausadaDesde: null, motivoPausa: null, fechaEstimadaTercero: null, reclasificaciones: 0, asignado: null,
      ...extra,
    },
  }
}

describe('Lista de solicitudes desde GET /solicitudes/vencimiento', () => {
  it('muestra la solicitud real con su semáforo y conserva el orden que manda el backend', () => {
    const lista = listaDeVencimiento([fila(2, {}, 'ROJO'), fila(1, {}, 'AMARILLO')], { page: 0, size: 10 })
    expect(lista.content.map((f) => f.codigoSolicitud)).toEqual(['SOL-002', 'SOL-001'])
    expect(lista.content.map((f) => f.semaforo)).toEqual(['ROJO', 'AMARILLO'])
    expect(lista.totalElements).toBe(2)
  })

  it('una pausada no inventa color', () => {
    const lista = listaDeVencimiento([fila(1, { estado: 'EN_ESPERA_TERCERO' }, 'PAUSADA')], { page: 0, size: 10 })
    expect(lista.content[0]?.semaforo).toBeNull()
  })

  it('filtra por texto, estado, plazo y asistente, y pagina', () => {
    const filas = [
      fila(1, { asunto: 'Filtros de aire', asignado: { idUsuario: 7, nombreUsuario: 'a', nombres: 'A' } }),
      fila(2, { estado: 'EN_REVISION', tipoPlazo: 'IMPORTADO' }),
      fila(3),
    ]
    expect(listaDeVencimiento(filas, { page: 0, size: 10, q: ' AIRE ' }).content.map((f) => f.idSolicitud)).toEqual([1])
    expect(listaDeVencimiento(filas, { page: 0, size: 10, estado: 'EN_REVISION' }).content.map((f) => f.idSolicitud)).toEqual([2])
    expect(listaDeVencimiento(filas, { page: 0, size: 10, tipoPlazo: 'IMPORTADO' }).content.map((f) => f.idSolicitud)).toEqual([2])
    expect(listaDeVencimiento(filas, { page: 0, size: 10, idAsistente: 7 }).content.map((f) => f.idSolicitud)).toEqual([1])
    const pagina2 = listaDeVencimiento(filas, { page: 1, size: 2 })
    expect(pagina2.content.map((f) => f.idSolicitud)).toEqual([3])
    expect(pagina2.totalPages).toBe(2)
  })

  it('sin solicitudes devuelve la lista vacía', () => {
    expect(listaDeVencimiento([], { page: 0, size: 10 })).toEqual({ content: [], totalElements: 0, totalPages: 0 })
  })
})