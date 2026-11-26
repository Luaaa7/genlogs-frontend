import { Link } from 'react-router-dom'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { textoPlazo } from '@/features/despacho/api/despachoTipos'
import { useDespachosPortal } from '@/features/despacho/hooks/useDespachos'
import { BotonNuevaSolicitud } from '../components/BotonNuevaSolicitud'
import { EncabezadoPortal } from '../components/EncabezadoPortal'
import { EstadoVacioIlustrado } from '../components/EstadoVacioIlustrado'
import { ListaEsqueleto } from '../components/SkeletonCard'
import { ENTRADA_TARJETA, TARJETA_ELEVABLE, retardoEntrada } from '../lib/estilosTarjeta'

/** Despachos del cliente: etapa, plazo y número de orden. */
export function MisDespachosPage() {
  const { data, isLoading, isError, error, refetch } = useDespachosPortal()
  const despachos = data ?? []

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPortal titulo="Mis despachos" descripcion="Etapa y plazo de las órdenes en camino." accion={<BotonNuevaSolicitud variante="pildora" />} />
      {isError && <ErrorBanner message="No se pudieron cargar los despachos." error={error} onRetry={() => refetch()} />}
      {isLoading ? (
        <ListaEsqueleto variante="despacho" etiqueta="Cargando despachos..." />
      ) : !isError && despachos.length === 0 ? (
        <EstadoVacioIlustrado
          ilustracion="despachos"
          titulo="Aún no hay despachos"
          descripcion="Cuando aprobemos una orden y salga en camino, verás aquí su etapa y su plazo."
          accion={<Link to="/portal/solicitud" className="inline-flex items-center rounded-md bg-[#FACC15] px-4 py-2 text-sm font-bold text-[#183153] hover:bg-[#EAB308] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Crear mi primera solicitud</Link>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {despachos.map((despacho, indice) => (
            <li key={despacho.id} style={retardoEntrada(indice)} className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-card ${TARJETA_ELEVABLE} ${ENTRADA_TARJETA}`}>
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
