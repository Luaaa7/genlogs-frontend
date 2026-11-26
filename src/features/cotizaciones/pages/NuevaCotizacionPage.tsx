import React from 'react'
import { useSearchParams } from 'react-router-dom'
import type { CrearCotizacionFormData } from '@/lib/validators/cotizacion.schema'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { useDetalleSolicitud, useItemsSolicitud } from '@/features/solicitudes/hooks/useSolicitudInterna'
import { valoresDesdeSolicitud } from '@/features/solicitudes/lib/cotizarDesdeSolicitud'
import { FormularioCotizacion } from '../components/FormularioCotizacion'

/**
 * Nueva cotización. El formulario vive en FormularioCotizacion, compartido con la edición.
 * Con ?solicitud=ID arranca con el cliente y los repuestos de esa solicitud, y al crear la liga con ella.
 */
export const NuevaCotizacionPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const clienteDeUrl = Number(searchParams.get('cliente'))
  const solicitudDeUrl = Number(searchParams.get('solicitud'))
  const haysolicitud = Number.isInteger(solicitudDeUrl) && solicitudDeUrl > 0
  const detalle = useDetalleSolicitud(solicitudDeUrl, haysolicitud)
  const items = useItemsSolicitud(solicitudDeUrl, haysolicitud)

  if (haysolicitud && (detalle.isLoading || items.isLoading)) {
    return <p role="status" className="text-sm text-muted-foreground">Cargando la solicitud…</p>
  }

  const desdeSolicitud = haysolicitud && detalle.data && items.data ? valoresDesdeSolicitud(detalle.data, items.data) : null

  const valoresIniciales = desdeSolicitud?.valores ?? ({
    clienteId: Number.isInteger(clienteDeUrl) && clienteDeUrl > 0 ? clienteDeUrl : undefined,
    condicionPago: undefined,
    moneda: undefined,
    observaciones: '',
    detalles: [],
  } as unknown as CrearCotizacionFormData)

  return (
    <div className="flex flex-col gap-4">
      {haysolicitud && !desdeSolicitud && (
        <ErrorBanner message="No se pudo cargar la solicitud. Puedes crear la cotización, pero no quedará ligada a ella." error={detalle.error ?? items.error} />
      )}
      {desdeSolicitud && detalle.data && (
        <p role="status" className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
          Cotizando la solicitud <strong>{detalle.data.codigoSolicitud}</strong>.
          {desdeSolicitud.pendientes.length > 0 &&
            ` Estos repuestos aún no están en el catálogo y falta elegirlos del catálogo (o crearlos): ${desdeSolicitud.pendientes.map((p) => p.descripcion).join(', ')}.`}
        </p>
      )}
      <FormularioCotizacion modo="crear" valoresIniciales={valoresIniciales} idSolicitud={desdeSolicitud ? solicitudDeUrl : undefined} />
    </div>
  )
}
