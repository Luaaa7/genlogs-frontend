import { Link, useParams } from 'react-router-dom'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { PageHeader } from '@/components/ui/PageHeader'
import { mensajeBloqueo, nombreOrigen } from '../api/despachoTipos'
import { AccionesDespacho } from '../components/AccionesDespacho'
import { useDespacho } from '../hooks/useDespachos'

export function DespachoDetallePage() {
  const id = Number(useParams().id)
  const valido = Number.isFinite(id) && id > 0
  const { data, isLoading, isError, error, refetch } = useDespacho(valido ? id : null)
  const bloqueo = data ? mensajeBloqueo(data.bloqueoSst) : null

  if (!valido) {
    return <p className="text-sm text-muted-foreground">No se encontró el despacho.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo={data?.codigo ?? 'Despacho'}
        descripcion={data ? `${nombreOrigen(data.origen)} · ${data.plazoEntrega}` : 'Cargando el despacho…'}
        acciones={<Link to="/despachos" className="text-sm text-accent hover:underline">Volver a la lista</Link>}
      />
      {isLoading && <p role="status" className="text-sm text-muted-foreground">Cargando el despacho…</p>}
      {isError && <ErrorBanner message="No se pudo cargar el despacho." error={error} onRetry={() => refetch()} />}
      {data && (
        <>
          {bloqueo && (
            <div role="alert" className="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-text">{bloqueo}</div>
          )}
          <ol aria-label="Etapas del despacho" className="flex flex-col gap-2">
            {data.etapas.map((etapa) => {
              const actual = etapa.codigo === data.etapaActual
              return (
                <li key={etapa.codigo} className="flex items-center gap-2 text-sm" aria-current={actual ? 'step' : undefined}>
                  <span className={actual ? 'font-medium text-foreground' : 'text-muted-foreground'}>{etapa.nombre}</span>
                  {actual && <span className="text-xs text-muted-foreground">Etapa actual</span>}
                </li>
              )
            })}
          </ol>
          <AccionesDespacho despacho={data} />
        </>
      )}
    </div>
  )
}
