import { Link, useParams } from 'react-router-dom'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { PageHeader } from '@/components/ui/PageHeader'
import { nombreOrigen, textoPlazo } from '../api/despachoTipos'
import { AccionesDespacho } from '../components/AccionesDespacho'
import { useDespacho } from '../hooks/useDespachos'

const TEXTO_ORIGEN = 'Falta el origen de algún ítem'

export function DespachoDetallePage() {
  const id = Number(useParams().id)
  const valido = Number.isFinite(id) && id > 0
  const { data, isLoading, isError, error, refetch } = useDespacho(valido ? id : null)

  if (!valido) {
    return <p className="text-sm text-muted-foreground">No se encontró el despacho.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo={data ? `Orden ${data.numeroOrdenCompra}` : 'Despacho'}
        descripcion={data ? `${nombreOrigen(data.origen)} · ${textoPlazo(data.plazoDesde, data.plazoHasta)}` : 'Cargando el despacho…'}
        acciones={<Link to="/despachos" className="text-sm text-accent hover:underline">Volver a la lista</Link>}
      />
      {isLoading && <p role="status" className="text-sm text-muted-foreground">Cargando el despacho…</p>}
      {isError && <ErrorBanner message="No se pudo cargar el despacho." error={error} onRetry={() => refetch()} />}
      {data && (
        <>
          <p className="text-sm">
            <span className="text-muted-foreground">Etapa actual: </span>
            <span className="font-medium">{data.etapaNombre}</span>
          </p>
          {data.origenIncompleto && (
            <p role="status" className="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-text">{TEXTO_ORIGEN}</p>
          )}
          <AccionesDespacho despacho={data} />
        </>
      )}
    </div>
  )
}
