import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, ShoppingCart } from 'lucide-react'
import { VistaPreviaPdf } from '@/components/ui/VistaPreviaPdf'
import { useOrdenesCompra } from '../hooks/useOrdenesCompra'
import { EstadoOrdenSelect } from '../components/EstadoOrdenSelect'
import { OcMineraPanel } from '../components/OcMineraPanel'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { TableSkeletonRows } from '@/components/ui/TableSkeletonRows'
import { PageHeader } from '@/components/ui/PageHeader'
import { FiltroChips } from '@/components/ui/FiltroChips'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { Paginacion, Tabla, TablaCard, Td, Th, filaClass } from '@/components/ui/tabla'
import { ESTADOS_ORDEN } from '@/lib/formatters/estados'
import { formatearMoneda } from '@/lib/formatters/codigoCotizacion'
import { formatearFechaCorta } from '@/lib/formatters/fechaLocal'
import type { EstadoOrdenCompra } from '@/types/ordenCompra.types'

const OPCIONES = [
  { label: 'Todas' },
  ...Object.entries(ESTADOS_ORDEN).map(([valor, e]) => ({ valor: valor as EstadoOrdenCompra, label: e.label })),
]

export function OrdenesCompraPage() {
  const [estado, setEstado] = useState<EstadoOrdenCompra | undefined>()
  const [pagina, setPagina] = useState(0)
  const [tamano, setTamano] = useState(10)
  const { data, isLoading, isError, error: errorCarga, refetch } = useOrdenesCompra({ estadoCodigo: estado, page: pagina, size: tamano })
  const ordenes = data?.content ?? []
  const [errorEstado, setErrorEstado] = useState<string | null>(null)
  const [panelId, setPanelId] = useState<number | null>(null)
  // Orden del cliente (PDF o imagen) que se está viendo en la ventana
  const [viendoOrden, setViendoOrden] = useState<{ url: string; numero: string } | null>(null)
  const panel = ordenes.find((o) => (o.idOrdenCompra ?? o.id) === panelId) ?? null

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Órdenes de compra"
        descripcion={data ? <><span className="tabular-nums">{data.totalElements}</span> órdenes recibidas de clientes</> : 'Órdenes que los clientes emiten a partir de una cotización aprobada'}
      />

      <FiltroChips etiqueta="Filtrar por estado" opciones={OPCIONES} valor={estado} onChange={(v) => { setEstado(v); setPagina(0) }} />

      {errorEstado && <ErrorBanner message={errorEstado} />}
      {isError && <ErrorBanner message="No se pudieron cargar las órdenes de compra." error={errorCarga} onRetry={() => refetch()} />}

      <TablaCard
        pie={data && (
          <Paginacion
            pagina={pagina}
            totalPaginas={data.totalPages}
            total={data.totalElements}
            enPagina={ordenes.length}
            tamano={tamano}
            onPagina={setPagina}
            onTamano={(t) => { setTamano(t); setPagina(0) }}
          />
        )}
      >
        {!isLoading && !isError && ordenes.length === 0 ? (
          <EstadoVacio
            icono={<ShoppingCart className="h-5.5 w-5.5" />}
            titulo={estado ? 'No hay órdenes en este estado' : 'Aún no hay órdenes de compra'}
            descripcion={estado ? 'Prueba con otro estado.' : 'Se registran desde una cotización aprobada, con la orden que envía el cliente.'}
          />
        ) : (
          <Tabla titulo="Órdenes de compra">
            <thead>
              <tr>
                <Th>Número</Th>
                <Th>Cliente</Th>
                <Th>Cotización de origen</Th>
                <Th>Recibida</Th>
                <Th>Estado</Th>
                <Th alinear="derecha">Total</Th>
                <Th><span className="sr-only">Documento</span></Th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows columns={7} />
              ) : (
                ordenes.map((o) => {
                  return (
                    <tr key={o.idOrdenCompra ?? o.id} className={filaClass}>
                      <Td className="whitespace-nowrap font-medium tabular-nums">
                        <p>{o.numeroOrdenCompra ?? o.numero}</p>
                        {o.numeroOcCliente ? <p className="text-xs font-normal text-muted-foreground">OC minera {o.numeroOcCliente}</p> : null}
                      </Td>
                      <Td>{o.clienteNombre ?? o.cliente ?? '—'}</Td>
                      <Td className="whitespace-nowrap">
                        <Link to={`/cotizaciones/${o.idCotizacion}`} className="rounded tabular-nums text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          {o.codigoCotizacion ?? `Cotización #${o.idCotizacion}`}
                        </Link>
                      </Td>
                      <Td className="whitespace-nowrap tabular-nums">{formatearFechaCorta(o.fechaRecepcion ?? o.fechaEmision)}</Td>
                      <Td>
                        <EstadoOrdenSelect
                          idOrden={o.idOrdenCompra ?? o.id ?? 0}
                          idCotizacion={o.idCotizacion}
                          estadoActual={o.estadoCodigo ?? o.estado ?? ''}
                          numero={o.numeroOrdenCompra ?? o.numero ?? ''}
                          onError={setErrorEstado}
                        />
                      </Td>
                      <Td alinear="derecha" className="whitespace-nowrap font-medium">{formatearMoneda(o.total ?? 0, o.moneda ?? 'PEN')}</Td>
                      <Td className="whitespace-nowrap text-right">
                        {o.urlArchivo && (
                          <button
                            type="button"
                            onClick={() => setViendoOrden({ url: o.urlArchivo as string, numero: o.numeroOrdenCompra ?? o.numero ?? '' })}
                            aria-label={`Ver el documento de la orden ${o.numeroOrdenCompra ?? o.numero}`}
                            title="Ver el documento que envió el cliente"
                            className="mr-3 inline-flex items-center gap-1 rounded text-[13px] font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                            Ver
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setPanelId(o.idOrdenCompra ?? o.id ?? 0)}
                          className="rounded text-[13px] font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          OC de la minera
                        </button>
                      </Td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </Tabla>
        )}
      </TablaCard>

      {panel && <OcMineraPanel orden={panel} onCerrar={() => setPanelId(null)} />}

      {viendoOrden && (
        <VistaPreviaPdf
          titulo={`Orden de compra ${viendoOrden.numero}`}
          nombreArchivo={`orden-${viendoOrden.numero}`}
          urlDirecta={viendoOrden.url}
          esImagen={/\.(png|jpe?g|webp)(\?|$)/i.test(viendoOrden.url)}
          onClose={() => setViendoOrden(null)}
        />
      )}
    </div>
  )
}