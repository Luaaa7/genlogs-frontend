import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, Receipt } from 'lucide-react'
import { facturacionApi } from '@/api/facturacionApi'
import { VistaPreviaComprobante } from '@/features/facturacion/components/VistaPreviaComprobante'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { Paginacion, Tabla, Td, Th, filaClass } from '@/components/ui/tabla'
import { usePaginacionLocal } from '@/hooks/usePaginacionLocal'
import { ESTADOS_FACTURA, estadoDe } from '@/lib/formatters/estados'
import { formatearMoneda } from '@/lib/formatters/codigoCotizacion'
import { normalizarMoneda, simboloMoneda } from '@/lib/formatters/currency'
import { formatearFechaCorta, parsearFechaLocal } from '@/lib/formatters/fechaLocal'
import type { Factura } from '@/types/facturacion.types'

const idDe = (f: Factura) => f.idFacturacion ?? f.id ?? 0
const codigoDe = (f: Factura) => f.codigoComprobante ?? `${f.serieComprobante ?? f.serie}-${f.numeroComprobante ?? f.numero}`
const estadoDeFactura = (f: Factura) => (f.estadoCodigo ?? f.estado ?? '') as string
const anulada = (f: Factura) => estadoDeFactura(f) === 'ANULADA'
const saldoDe = (f: Factura) => (anulada(f) ? 0 : f.saldoPendiente ?? Math.max(0, (f.total ?? 0) - (f.montoPagado ?? 0)))

/** Historial de ventas de un cliente: todos sus comprobantes, del más reciente al más antiguo,
 *  con el total facturado, lo cobrado y lo que falta cobrar (por moneda). */
export function HistorialVentasCliente({ idCliente }: { idCliente: number }) {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['facturacion', 'cliente', idCliente],
    queryFn: () => facturacionApi.listarPorCliente(idCliente),
    enabled: idCliente > 0,
  })
  const [viendo, setViendo] = useState<Factura | null>(null)

  const ordenadas = useMemo(
    () =>
      [...data].sort((a, b) => {
        const fa = parsearFechaLocal(a.fechaEmision)?.getTime() ?? 0
        const fb = parsearFechaLocal(b.fechaEmision)?.getTime() ?? 0
        return fb - fa || idDe(b) - idDe(a)
      }),
    [data],
  )
  const pag = usePaginacionLocal(ordenadas, 10)

  // Los comprobantes anulados se listan, pero no cuentan en los totales.
  const resumen = useMemo(() => {
    const porMoneda = new Map<string, { facturado: number; cobrado: number; pendiente: number; cantidad: number }>()
    for (const f of data) {
      if (anulada(f)) continue
      const moneda = normalizarMoneda(f.moneda ?? 'PEN')
      const actual = porMoneda.get(moneda) ?? { facturado: 0, cobrado: 0, pendiente: 0, cantidad: 0 }
      actual.facturado += f.total ?? 0
      actual.cobrado += f.montoPagado ?? 0
      actual.pendiente += saldoDe(f)
      actual.cantidad += 1
      porMoneda.set(moneda, actual)
    }
    return [...porMoneda.entries()]
  }, [data])

  return (
    <section aria-labelledby="historial-t" className="rounded-xl border border-border bg-card p-5">
      <h2 id="historial-t" className="mb-1 text-base font-semibold">Historial de ventas</h2>
      <p className="mb-4 text-sm text-muted-foreground">Comprobantes emitidos a este cliente, del más reciente al más antiguo.</p>

      {isLoading ? (
        <Skeleton variant="rectangular" className="h-24" />
      ) : isError ? (
        <p role="alert" className="text-sm text-destructive">No se pudo cargar el historial de ventas.</p>
      ) : data.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Receipt className="h-4 w-4" aria-hidden="true" />Este cliente aún no tiene ventas facturadas.
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2">
            {resumen.map(([moneda, r]) => (
              <dl key={moneda} className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3 text-sm sm:grid-cols-4">
                <div><dt className="text-[13px] text-muted-foreground">Comprobantes ({simboloMoneda(moneda)})</dt><dd className="mt-0.5 font-semibold tabular-nums">{r.cantidad}</dd></div>
                <div><dt className="text-[13px] text-muted-foreground">Facturado</dt><dd className="mt-0.5 font-semibold tabular-nums">{formatearMoneda(r.facturado, moneda)}</dd></div>
                <div><dt className="text-[13px] text-muted-foreground">Cobrado</dt><dd className="mt-0.5 font-semibold tabular-nums">{formatearMoneda(r.cobrado, moneda)}</dd></div>
                <div><dt className="text-[13px] text-muted-foreground">Por cobrar</dt><dd className="mt-0.5 font-semibold tabular-nums">{formatearMoneda(r.pendiente, moneda)}</dd></div>
              </dl>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <Tabla titulo="Historial de ventas del cliente" minWidth={640}>
              <thead>
                <tr>
                  <Th>Comprobante</Th>
                  <Th>Emisión</Th>
                  <Th>Estado</Th>
                  <Th alinear="derecha">Total</Th>
                  <Th alinear="derecha">Por cobrar</Th>
                  <Th alinear="derecha"><span className="sr-only">Ver</span></Th>
                </tr>
              </thead>
              <tbody>
                {pag.visibles.map((f) => {
                  const moneda = f.moneda ?? 'PEN'
                  const estado = estadoDe(ESTADOS_FACTURA, estadoDeFactura(f))
                  return (
                    <tr key={idDe(f)} className={filaClass}>
                      <Td>
                        <p className="font-medium tabular-nums">{codigoDe(f)}</p>
                        {f.numeroOrdenCompra && <p className="text-xs text-muted-foreground">Orden {f.numeroOrdenCompra}</p>}
                      </Td>
                      <Td className="whitespace-nowrap tabular-nums">{formatearFechaCorta(f.fechaEmision)}</Td>
                      <Td><EstadoBadge tono={estado.tono}>{estado.label}</EstadoBadge></Td>
                      <Td alinear="derecha" className="whitespace-nowrap tabular-nums">{formatearMoneda(f.total ?? 0, moneda)}</Td>
                      <Td alinear="derecha" className="whitespace-nowrap tabular-nums">{formatearMoneda(saldoDe(f), moneda)}</Td>
                      <Td alinear="derecha">
                        {!anulada(f) && (
                          <button
                            type="button"
                            onClick={() => setViendo(f)}
                            aria-label={`Ver comprobante ${codigoDe(f)}`}
                            title="Ver comprobante"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </Tabla>
            <Paginacion pagina={pag.pagina} totalPaginas={pag.totalPaginas} total={pag.total} enPagina={pag.enPagina} tamano={pag.tamano} onPagina={pag.onPagina} onTamano={pag.onTamano} />
          </div>
        </>
      )}

      {viendo && <VistaPreviaComprobante idFactura={idDe(viendo)} codigo={codigoDe(viendo)} onClose={() => setViendo(null)} />}
    </section>
  )
}
