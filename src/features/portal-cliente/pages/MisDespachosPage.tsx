import { Truck } from 'lucide-react'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { textoPlazo } from '@/features/despacho/api/despachoTipos'
import { useDespachosPortal } from '@/features/despacho/hooks/useDespachos'

/** Despachos del cliente: etapa, plazo y número de orden. */
export function MisDespachosPage() {
  const { data, isLoading, isError, error, refetch } = useDespachosPortal()
  const despachos = data ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Portal del cliente</p>
        <h1 className="mt-2 text-3xl font-bold">Mis despachos</h1>
        <p className="mt-2 text-muted-foreground">Etapa y plazo de las órdenes en camino.</p>
      </div>
      {isError && <ErrorBanner message="No se pudieron cargar los despachos." error={error} onRetry={() => refetch()} />}
      {isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">Cargando despachos…</p>
      ) : !isError && despachos.length === 0 ? (
        <EstadoVacio icono={<Truck className="h-5 w-5" />} titulo="Aún no hay despachos" />
      ) : (
        <ul className="flex flex-col gap-3">
          {despachos.map((despacho) => (
            <li key={despacho.id} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Orden {despacho.numeroOrdenCompra}</p>
              <p className="mt-1 font-medium">{despacho.etapaNombre}</p>
              <p className="mt-2 text-sm tabular-nums text-muted-foreground">{textoPlazo(despacho.plazoDesde, despacho.plazoHasta)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
