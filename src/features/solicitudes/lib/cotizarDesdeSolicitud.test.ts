import { describe, expect, it } from 'vitest'
import type { ItemIdentificacion, SolicitudInternaResponse } from '@/api/contratos/solicitudes'
import { puedeCotizar, rutaCotizarDesde, valoresDesdeSolicitud } from './cotizarDesdeSolicitud'

const solicitud = (cambios: Partial<SolicitudInternaResponse> = {}): SolicitudInternaResponse => ({
  idSolicitud: 7, codigoSolicitud: 'SOL-2026-7', asunto: 'Filtros', cliente: 'Minera Sur', estado: 'EN_REVISION', tipoPlazo: 'COMUN',
  fechaRecepcion: '2026-11-10T09:00:00', fechaLimiteInterna: null, pausadaDesde: null, motivoPausa: null, fechaEstimadaTercero: null,
  reclasificaciones: 0, asignado: null, idCliente: 4, idCotizacion: null, codigoCotizacion: null, ...cambios,
})

const item = (cambios: Partial<ItemIdentificacion> = {}): ItemIdentificacion => ({
  idItem: 1, descripcion: 'Filtro de aire', cantidad: 2, unidad: 'UND', idMarca: null, marca: 'Caterpillar', numeroParte: '1R-0750', gtin: null,
  urlFoto: null, idProducto: 9, equivalentes: [], confirmado: true, confirmadoPor: null, fechaConfirmacion: null, ...cambios,
})

describe('puedeCotizar', () => {
  it('el Asistente Logístico y el Jefe cotizan una solicitud abierta que aún no tiene cotización', () => {
    expect(puedeCotizar('ASISTENTE_LOGISTICO', solicitud({ estado: 'PENDIENTE' }))).toBe(true)
    expect(puedeCotizar('JEFE_ADMINISTRATIVO', solicitud({ estado: 'EN_REVISION' }))).toBe(true)
    expect(puedeCotizar('ASISTENTE_LOGISTICO', solicitud({ estado: 'EN_ESPERA_TERCERO' }))).toBe(true)
  })

  it('los demás roles, o sin sesión, no cotizan', () => {
    expect(puedeCotizar('ASISTENTE_ADMINISTRATIVO', solicitud())).toBe(false)
    expect(puedeCotizar('GERENTE_GENERAL', solicitud())).toBe(false)
    expect(puedeCotizar(null, solicitud())).toBe(false)
  })

  it('no se cotiza dos veces ni una solicitud cerrada', () => {
    expect(puedeCotizar('ASISTENTE_LOGISTICO', solicitud({ idCotizacion: 50, codigoCotizacion: 'COT-2026-50' }))).toBe(false)
    expect(puedeCotizar('ASISTENTE_LOGISTICO', solicitud({ estado: 'COTIZADA' }))).toBe(false)
    expect(puedeCotizar('ASISTENTE_LOGISTICO', solicitud({ estado: 'CANCELADA' }))).toBe(false)
    expect(puedeCotizar('ASISTENTE_LOGISTICO', solicitud({ estado: 'RECHAZADA' }))).toBe(false)
  })
})

describe('rutaCotizarDesde', () => {
  it('abre Nueva cotización con el número de la solicitud', () => {
    expect(rutaCotizarDesde(7)).toBe('/cotizaciones/nueva?solicitud=7')
  })
})

describe('valoresDesdeSolicitud', () => {
  it('trae el cliente y los repuestos del catálogo con su cantidad', () => {
    const { valores, pendientes } = valoresDesdeSolicitud(solicitud(), [item()])
    expect(valores.clienteId).toBe(4)
    expect(valores.detalles).toHaveLength(1)
    expect(valores.detalles[0]).toMatchObject({ producto: 'Filtro de aire', idProducto: 9, tipoItem: 'producto', cantidad: 2 })
    expect(pendientes).toEqual([])
  })

  it('el precio queda vacío: lo pone quien cotiza', () => {
    const { valores } = valoresDesdeSolicitud(solicitud(), [item()])
    expect(valores.detalles[0].precioUnitario).toBeUndefined()
  })

  it('los repuestos que no están en el catálogo quedan como pendientes de elegir', () => {
    const sinCatalogo = item({ idItem: 2, descripcion: 'Sello de goma', idProducto: null, numeroParte: null })
    const { valores, pendientes } = valoresDesdeSolicitud(solicitud(), [item(), sinCatalogo])
    expect(valores.detalles).toHaveLength(1)
    expect(pendientes.map((p) => p.descripcion)).toEqual(['Sello de goma'])
  })

  it('en las observaciones va el código de la solicitud, sin datos del cliente', () => {
    const { valores } = valoresDesdeSolicitud(solicitud(), [item()])
    expect(valores.observaciones).toBe('Solicitud SOL-2026-7')
  })

  it('sin cliente conocido no inventa uno', () => {
    const { valores } = valoresDesdeSolicitud(solicitud({ idCliente: null }), [item()])
    expect(valores.clienteId).toBeUndefined()
  })
})
