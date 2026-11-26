import type { Rol } from '@/api/contratos'
import type { ItemIdentificacion, SolicitudInternaResponse } from '@/api/contratos/solicitudes'
import type { CrearCotizacionFormData } from '@/lib/validators/cotizacion.schema'
import { ESTADOS_ABIERTOS, puedeActuar } from './reglasSolicitud'

/** Quien trabaja la solicitud (Asistente Logístico o Jefe) puede cotizarla si sigue abierta y aún no tiene cotización. */
export function puedeCotizar(rol: Rol | null, solicitud: SolicitudInternaResponse): boolean {
  const abierta = (ESTADOS_ABIERTOS as readonly string[]).includes(solicitud.estado)
  return puedeActuar(rol) && abierta && solicitud.idCotizacion == null
}

export function rutaCotizarDesde(idSolicitud: number): string {
  return `/cotizaciones/nueva?solicitud=${idSolicitud}`
}

/**
 * Valores con los que arranca «Nueva cotización». Solo entran los repuestos que ya están en el catálogo
 * (el backend pide producto o servicio en cada línea); los demás se devuelven como pendientes.
 * El precio no se inventa: lo pone quien cotiza.
 */
export function valoresDesdeSolicitud(
  solicitud: SolicitudInternaResponse,
  items: ItemIdentificacion[],
): { valores: CrearCotizacionFormData; pendientes: ItemIdentificacion[] } {
  const delCatalogo = items.filter((i) => i.idProducto != null)
  const valores = {
    clienteId: solicitud.idCliente ?? undefined,
    condicionPago: undefined,
    moneda: undefined,
    observaciones: `Solicitud ${solicitud.codigoSolicitud}`,
    detalles: delCatalogo.map((i) => ({
      producto: i.descripcion,
      idProducto: i.idProducto as number,
      tipoItem: 'producto' as const,
      cantidad: i.cantidad,
      precioUnitario: undefined,
      subtotal: 0,
    })),
  } as unknown as CrearCotizacionFormData
  return { valores, pendientes: items.filter((i) => i.idProducto == null) }
}
