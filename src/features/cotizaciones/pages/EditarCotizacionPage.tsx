import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { Skeleton } from '@/components/ui/skeleton'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { usePermisos } from '@/lib/permisos'
import { EstadoCotizacion } from '@/types/cotizacion.types'
import { useCotizacion } from '../hooks/useCotizaciones'
import { creaCotizaciones, veCotizaciones } from '../lib/rolesCotizacion'
import { valoresDeCotizacion } from '../lib/valoresCotizacion'
import { FormularioCotizacion } from '../components/FormularioCotizacion'

/** SUPUESTO: en edición la moneda no se cambia. Poner en false para volver a permitirla. */
const MONEDA_SOLO_LECTURA_EN_EDICION = true

export const EditarCotizacionPage: React.FC = () => {
  const { rol } = usePermisos()
  if (!veCotizaciones(rol) && !creaCotizaciones(rol)) {
    return <EstadoVacio icono={<FileText className="h-5 w-5" />} titulo="No tienes acceso a las cotizaciones" />
  }
  return <EditarCotizacionContenido />
}

const EditarCotizacionContenido: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const cotizacionId = id ? Number(id) : null
  const { data: cotizacion, isLoading, isError, refetch } = useCotizacion(cotizacionId)

  if (!cotizacionId) return <ErrorBanner message="El enlace de la cotización no es válido." />
  if (isLoading) {
    return (
      <>
        <p role="status" className="sr-only">Cargando la cotización…</p>
        <Skeleton variant="rectangular" className="h-80" />
      </>
    )
  }
  if (isError || !cotizacion) {
    return (
      <div className="flex flex-col items-center gap-4">
        <ErrorBanner message="No se pudo cargar la cotización." />
        <Button onClick={() => refetch()}>Reintentar</Button>
      </div>
    )
  }

  const estado = cotizacion.estadoCodigo ?? cotizacion.estadoCotizacion ?? cotizacion.estado
  if (estado !== EstadoCotizacion.BORRADOR) {
    return (
      <div role="alert" className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning-text">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-lg font-semibold">Solo se puede editar un borrador</h1>
          <p className="mt-1 text-sm text-muted-foreground">Esta cotización ya no está en borrador, así que no se guarda ningún cambio.</p>
        </div>
        <Button asChild><Link to={`/cotizaciones/${cotizacionId}`}>Volver al detalle</Link></Button>
      </div>
    )
  }

  return (
    <FormularioCotizacion
      key={cotizacionId}
      modo="editar"
      idCotizacion={cotizacionId}
      valoresIniciales={valoresDeCotizacion(cotizacion)}
      monedaBloqueada={MONEDA_SOLO_LECTURA_EN_EDICION}
      tipoCambioGuardado={cotizacion.tipoCambioUsado ?? null}
    />
  )
}
