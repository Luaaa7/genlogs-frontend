import { calcularSubtotal } from '@/lib/formatters/codigoCotizacion'
import type { CrearCotizacionFormData, CotizacionDetalleFormData } from '@/lib/validators/cotizacion.schema'
import type { Cotizacion, CotizacionDetalle } from '@/types/cotizacion.types'

/**
 * El backend no guarda costo ni margen por línea. El número queda en 0 solo
 * para cumplir el formulario; la edición no lo muestra como un margen real.
 */
export function lineaAlFormulario(detalle: CotizacionDetalle): CotizacionDetalleFormData {
  const cantidad = Number(detalle.cantidad)
  const precioUnitario = Number(detalle.precioUnitario)
  const margen = detalle.margen ?? detalle.margenPorcentaje
  return {
    idProducto: detalle.idProducto ?? undefined,
    idServicio: detalle.idServicio ?? undefined,
    ...(typeof detalle.idSourcing === 'number' ? { idSourcing: detalle.idSourcing } : {}),
    producto: detalle.producto || detalle.servicio || detalle.descripcionPersonalizada || detalle.descripcion || '',
    cantidad,
    precioUnitario,
    idUnidadMedida: detalle.idUnidadMedida || undefined,
    margenPorcentaje: margen == null ? 0 : Number(margen),
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
