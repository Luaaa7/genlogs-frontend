import { useState } from 'react'
import { Download, Loader2, Receipt } from 'lucide-react'
import { useFacturas } from '../hooks/useFacturacion'
import { facturacionApi } from '@/api/facturacionApi'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { TableSkeletonRows } from '@/components/ui/TableSkeletonRows'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { PageHeader } from '@/components/ui/PageHeader'
import { FiltroChips } from '@/components/ui/FiltroChips'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { Paginacion, Tabla, TablaCard, Td, Th, filaClass } from '@/components/ui/tabla'
import { ESTADOS_FACTURA, TIPOS_COMPROBANTE, estadoDe } from '@/lib/formatters/estados'
import { formatearMoneda } from '@/lib/formatters/codigoCotizacion'
import { formatearFechaCorta, parsearFechaLocal } from '@/lib/formatters/fechaLocal'
import type { EstadoFacturacion, Factura } from '@/types/facturacion.types'

const OPCIONES = [
  { label: 'Todos' },
  ...Object.entries(ESTADOS_FACTURA).map(([valor, e]) => ({ valor: valor as EstadoFacturacion, label: e.label })),
]

const idDe = (f: Factura) => f.idFacturacion ?? f.id ?? 0
const codigoDe = (f: Factura) => f.codigoComprobante ?? `${f.serieComprobante ?? f.serie}-${f.numeroComprobante ?? f.numero}`
/** Lo que falta cobrar; un comprobante anulado no tiene saldo. */
const saldoDe = (f: Factura) =>
  (f.estadoCodigo ?? f.estado) === 'ANULADA' ? 0 : f.saldoPendiente ?? Math.max(0, (f.total ?? 0) - (f.montoPagado ?? 0))

/** "Vence en 3 días" / "Venció hace 2 días" para comprobantes con saldo. */
function notaCobro(f: Factura): { texto: string; clase: string } | null {
  const estado = f.estadoCodigo ?? f.estado
  if (estado === 'PAGADA' || estado === 'ANULADA' || saldoDe(f) <= 0) return null
  const fecha = parsearFechaLocal(f.fechaVencimiento)
  if (!fecha) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const dias = Math.round((fecha.getTime() - hoy.getTime()) / 86_400_000)
  if (dias < 0) return { texto: `Venció hace ${-dias} ${dias === -1 ? 'día' : 'días'}`, clase: 'text-destructive' }
  if (dias <= 7) return { texto: dias === 0 ? 'Vence hoy' : `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}`, clase: 'text-warning-text' }
  return null
}

export function FacturacionPage() {
  const [estado, setEstado] = useState<EstadoFacturacion | undefined>()
  const [pagina, setPagina] = useState(0)
  const [tamano, setTamano] = useState(10)
  const [descargando, setDescargando] = useState<number | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const { data, isLoading, isError, refetch } = useFacturas({ estadoCodigo: estado, page: pagina, size: tamano })
  const facturas = data?.content ?? []

  async function descargar(f: Factura) {
    setErrorAccion(null)
    setDescargando(idDe(f))
    try {
      const pdf = await facturacionApi.descargarPdf(idDe(f))
      const url = URL.createObjectURL(pdf)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = `${codigoDe(f)}.pdf`
      enlace.click()
      URL.revokeObjectURL(url)
    } catch {
      setErrorAccion(`No se pudo descargar el PDF de ${codigoDe(f)}.`)
    } finally {
      setDescargando(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Facturación"
        descripcion={data ? <><span className="tabular-nums">{data.totalElements}</span> comprobantes emitidos</> : 'Facturas, boletas y notas emitidas a partir de órdenes de compra'}
      />

      <FiltroChips etiqueta="Filtrar por estado" opciones={OPCIONES} valor={estado} onChange={(v) => { setEstado(v); setPagina(0) }} />

      {(isError || errorAccion) && (
        <ErrorBanner message={errorAccion ?? 'No se pudieron cargar los comprobantes.'} onRetry={errorAccion ? undefined : () => refetch()} />
      )}

      <TablaCard
        pie={data && (
          <Paginacion
            pagina={pagina}
            totalPaginas={data.totalPages}
            total={data.totalElements}
            enPagina={facturas.length}
            tamano={tamano}
            onPagina={setPagina}
            onTamano={(t) => { setTamano(t); setPagina(0) }}
          />
        )}
      >
        {!isLoading && !isError && facturas.length === 0 ? (
          <EstadoVacio
            icono={<Receipt className="h-5.5 w-5.5" />}
            titulo={estado ? 'No hay comprobantes en este estado' : 'Aún no hay comprobantes'}
            descripcion={estado ? 'Prueba con otro estado.' : 'Se emiten a partir de una orden de compra atendida.'}
          />
        ) : (
          <Tabla titulo="Comprobantes" minWidth={860}>
            <thead>
              <tr>
                <Th>Comprobante</Th>
                <Th>Cliente</Th>
                <Th>Orden</Th>
                <Th>Emitido</Th>
                <Th>Vence</Th>
                <Th>Estado</Th>
                <Th alinear="derecha">Total</Th>
                <Th alinear="derecha">Saldo</Th>
                <Th><span className="sr-only">Acciones</span></Th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows columns={9} />
              ) : (
                facturas.map((f) => {
                  const e = estadoDe(ESTADOS_FACTURA, f.estadoCodigo ?? f.estado)
                  const nota = notaCobro(f)
                  const tipo = f.tipoComprobante ?? f.tipo
                  const moneda = f.moneda ?? 'PEN'
                  return (
                    <tr key={idDe(f)} className={filaClass}>
                      <Td className="whitespace-nowrap">
                        <p className="font-medium tabular-nums">{codigoDe(f)}</p>
                        {tipo && <p className="text-xs text-muted-foreground">{TIPOS_COMPROBANTE[tipo] ?? tipo}</p>}
                      </Td>
                      <Td>{f.clienteNombre ?? f.cliente ?? '—'}</Td>
                      <Td className="whitespace-nowrap tabular-nums">{f.numeroOrdenCompra ?? `#${f.idOrdenCompra}`}</Td>
                      <Td className="whitespace-nowrap tabular-nums">{formatearFechaCorta(f.fechaEmision)}</Td>
                      <Td className="whitespace-nowrap">
                        <p className="tabular-nums">{formatearFechaCorta(f.fechaVencimiento)}</p>
                        {nota && <p className={`text-xs ${nota.clase}`}>{nota.texto}</p>}
                      </Td>
                      <Td><EstadoBadge tono={e.tono}>{e.label}</EstadoBadge></Td>
                      <Td alinear="derecha" className="whitespace-nowrap font-medium">{formatearMoneda(f.total ?? 0, moneda)}</Td>
                      <Td alinear="derecha" className="whitespace-nowrap">{saldoDe(f) > 0 ? formatearMoneda(saldoDe(f), moneda) : '—'}</Td>
                      <Td className="text-right">
                        <button
                          type="button"
                          onClick={() => void descargar(f)}
                          disabled={descargando === idDe(f)}
                          aria-label={`Descargar PDF de ${codigoDe(f)}`}
                          title="Descargar PDF"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {descargando === idDe(f)
                            ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                            : <Download className="h-4 w-4" aria-hidden="true" />}
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
    </div>
  )
}
