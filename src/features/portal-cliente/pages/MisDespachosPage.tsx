import { Link } from 'react-router-dom'
import { CalendarRange, PackageCheck, Truck } from 'lucide-react'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { textoPlazo } from '@/features/despacho/api/despachoTipos'
import { useDespachosPortal } from '@/features/despacho/hooks/useDespachos'
import { BotonNuevaSolicitud } from '../components/BotonNuevaSolicitud'
import { EncabezadoPortal } from '../components/EncabezadoPortal'
import { EstadoVacioIlustrado } from '../components/EstadoVacioIlustrado'
import { EtapasDespacho } from '../components/EtapasDespacho'
import { ListaEsqueleto } from '../components/SkeletonCard'
import { ENTRADA_TARJETA, ICONO_TARJETA, TARJETA_ELEVABLE, TARJETA_PORTAL, retardoEntrada } from '../lib/estilosTarjeta'

/** Despachos del cliente: etapa, línea de progreso, plazo y número de orden. */
export function MisDespachosPage() {
  const { data, isLoading, isError, error, refetch } = useDespachosPortal()
  const despachos = data ?? []
  const entregados = despachos.filter((d) => d.etapa === 'ENTREGADO').length
  const enCamino = despachos.length - entregados

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPortal
        titulo="Mis despachos"
        descripcion="Etapa y plazo de las órdenes en camino."
        ilustracion="despachos"
        accion={<BotonNuevaSolicitud variante="pildora" />}
        resumen={despachos.length > 0 ? [
          { icono: <Truck />, valor: enCamino, texto: 'en camino' },
          { icono: <PackageCheck />, valor: entregados, texto: entregados === 1 ? 'entregado' : 'entregados' },
        ] : undefined}
      />
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
        <ul className="grid gap-4">
          {despachos.map((despacho, indice) => {
            const entregado = despacho.etapa === 'ENTREGADO'
            return (
              <li key={despacho.id} style={retardoEntrada(indice)} className={`group p-4 sm:p-6 ${TARJETA_PORTAL} ${TARJETA_ELEVABLE} ${ENTRADA_TARJETA}`}>
                <div className="flex items-start gap-3 sm:gap-4">
                  <span aria-hidden="true" className={ICONO_TARJETA}>{entregado ? <PackageCheck className="h-5 w-5" /> : <Truck className="h-5 w-5" />}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Orden de compra</p>
                        <p className="mt-0.5 text-lg font-bold tabular-nums text-[#183153] dark:text-slate-50">Orden {despacho.numeroOrdenCompra}</p>
                      </div>
                      <EstadoBadge tono={entregado ? 'success' : 'info'}>{despacho.etapaNombre}</EstadoBadge>
                    </div>
                  </div>
                </div>
                <EtapasDespacho etapa={despacho.etapa} className="mt-5" />
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-sm dark:border-white/10">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-[#EEF3F8] px-3 py-1.5 text-[#183153] dark:bg-white/[0.04] dark:text-slate-200">
                    <CalendarRange className="h-4 w-4 text-[#2E6BA8] dark:text-[#60A5FA]" aria-hidden="true" />
                    <span className="text-muted-foreground">Plazo de entrega:</span>
                    <span className="font-semibold tabular-nums">{textoPlazo(despacho.plazoDesde, despacho.plazoHasta)}</span>
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
