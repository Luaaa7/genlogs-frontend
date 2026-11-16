import { Link } from 'react-router-dom'
import { Truck } from 'lucide-react'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabla, TablaCard, Td, Th, filaClass } from '@/components/ui/tabla'
import { nombreOrigen, textoPlazo } from '../api/despachoTipos'
import { useDespachos } from '../hooks/useDespachos'

const TEXTO_ORIGEN = 'Falta el origen de algún ítem'

export function DespachosPage() {
  const { data, isLoading, isError, error, refetch } = useDespachos()
  const despachos = data ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader titulo="Despacho" descripcion="Etapa, origen y plazo de cada despacho" />
      {isError && <ErrorBanner message="No se pudieron cargar los despachos." error={error} onRetry={() => refetch()} />}
      {isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">Cargando despachos…</p>
      ) : !isError && despachos.length === 0 ? (
        <EstadoVacio icono={<Truck className="h-5 w-5" />} titulo="Aún no hay despachos" />
      ) : (
        <TablaCard>
          <Tabla titulo="Despachos">
            <thead>
              <tr>
                <Th>Orden</Th>
                <Th>Origen</Th>
                <Th>Etapa</Th>
                <Th>Plazo</Th>
              </tr>
            </thead>
            <tbody>
              {despachos.map((despacho) => (
                <tr key={despacho.idDespacho} className={filaClass}>
                  <Td className="whitespace-nowrap font-medium">
                    <Link to={`/despachos/${despacho.idDespacho}`} className="rounded text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      {despacho.numeroOrdenCompra}
                    </Link>
                    {despacho.origenIncompleto && <p className="text-xs font-normal text-warning-text">{TEXTO_ORIGEN}</p>}
                  </Td>
                  <Td>{nombreOrigen(despacho.origen)}</Td>
                  <Td>{despacho.etapaNombre}</Td>
                  <Td className="whitespace-nowrap tabular-nums">{textoPlazo(despacho.plazoDesde, despacho.plazoHasta)}</Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        </TablaCard>
      )}
    </div>
  )
}
