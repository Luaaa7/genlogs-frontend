import { calcularSubtotal } from '@/lib/formatters/codigoCotizacion'
import type { CrearCotizacionFormData, CotizacionDetalleFormData } from '@/lib/validators/cotizacion.schema'
import type { Cotizacion, CotizacionDetalle } from '@/types/cotizacion.types'

/** Precarga costo y margen tal como llegaron. null se queda vacío: no se inventa 0 %. */
export function lineaAlFormulario(detalle: CotizacionDetalle): CotizacionDetalleFormData {
  const cantidad = Number(detalle.cantidad)
  const precioUnitario = Number(detalle.precioUnitario)
  const margen = detalle.margenPorcentaje ?? detalle.margen
  return {
    idProducto: detalle.idProducto ?? undefined,
    idServicio: detalle.idServicio ?? undefined,
    producto: detalle.producto || detalle.servicio || detalle.descripcionPersonalizada || detalle.descripcion || '',
    cantidad,
    precioUnitario,
    idUnidadMedida: detalle.idUnidadMedida || undefined,
    costoUnitario: detalle.costoUnitario == null ? undefined : Number(detalle.costoUnitario),
    margenPorcentaje: margen == null ? undefined : Number(margen),
    subtotal: calcularSubtotal(cantidad, precioUnitario),
    tipoItem: detalle.idServicio ? 'servicio' : 'producto',
  }
}

export function valoresDeCotizacion(cotizacion: Cotizacion): CrearCotizacionFormData {
  return {
    clienteId: cotizacion.idCliente,
    condicionPago: cotizacion.condicionPago as CrearCotizacionFormData['condicionPago'],
    moneda: (cotizacion.monedaCodigo ?? cotizacion.moneda) as CrearCotizacionFormData['moneda'],
    observaciones: cotizacion.observaciones ?? '',
    detalles: (cotizacion.detalles ?? []).map(lineaAlFormulario),
  }
}
