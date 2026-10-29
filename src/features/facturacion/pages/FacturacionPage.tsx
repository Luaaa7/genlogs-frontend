import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Loader2, Receipt, Send } from 'lucide-react'
import { useAnularFactura, useFacturas, useRegistrarPago, useSubirArchivoFactura } from '../hooks/useFacturacion'
import { RegistrarPagoDialog } from '../components/RegistrarPagoDialog'
import { EnviarFacturaModal } from '../components/EnviarFacturaModal'
import { EstadoFacturaSelect } from '../components/EstadoFacturaSelect'
import { MasAccionesFactura } from '../components/MasAccionesFactura'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { facturacionApi } from '@/api/facturacionApi'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { FiltroActivo } from '@/components/ui/FiltroActivo'
import { TableSkeletonRows } from '@/components/ui/TableSkeletonRows'
import { PageHeader } from '@/components/ui/PageHeader'
import { FiltroChips } from '@/components/ui/FiltroChips'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { Paginacion, Tabla, TablaCard, Td, Th, filaClass } from '@/components/ui/tabla'
import { ESTADOS_FACTURA, TIPOS_COMPROBANTE, estadoDe } from '@/lib/formatters/estados'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { usePermisos } from '@/lib/permisos'
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

/** Días que faltan para el vencimiento (negativo = ya venció). */
function diasParaVencer(f: Factura): number | null {
  const fecha = parsearFechaLocal(f.fechaVencimiento)
  if (!fecha) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.round((fecha.getTime() - hoy.getTime()) / 86_400_000)
}

/**
 * Estado que se muestra: el backend no pasa solo las facturas a VENCIDA,
 * así que una EMITIDA o PARCIAL con saldo y fecha pasada se muestra como VENCIDA.
 */
function estadoReal(f: Factura): string {
  const estado = (f.estadoCodigo ?? f.estado ?? '') as string
  if ((estado === 'EMITIDA' || estado === 'PARCIAL') && saldoDe(f) > 0) {
    const dias = diasParaVencer(f)
    if (dias !== null && dias < 0) return 'VENCIDA'
  }
  return estado
}

/** "Vence en 3 días" / "Venció hace 2 días" para comprobantes con saldo. */
function notaCobro(f: Factura): { texto: string; clase: string } | null {
  const estado = f.estadoCodigo ?? f.estado
  if (estado === 'PAGADA' || estado === 'ANULADA' || saldoDe(f) <= 0) return null
  const dias = diasParaVencer(f)
  if (dias === null) return null
  if (dias < 0) return { texto: `Venció hace ${-dias} ${dias === -1 ? 'día' : 'días'}`, clase: 'text-destructive' }
  if (dias <= 7) return { texto: dias === 0 ? 'Vence hoy' : `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}`, clase: 'text-warning-text' }
  return null
}

export function FacturacionPage() {
  const permisos = usePermisos()
  const [estado, setEstado] = useState<EstadoFacturacion | undefined>()
  const [pagina, setPagina] = useState(0)
  const [tamano, setTamano] = useState(10)
  const [descargando, setDescargando] = useState<number | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  // Con un filtro de estado se trae todo y se filtra aquí con el estado real
  // (así "Vencida" sí muestra las facturas vencidas). Sin filtro, paginación del backend.
  // ?idOrdenCompra=7 llega desde una cotización o el dashboard: muestra solo la factura de esa orden.
  const [params] = useSearchParams()
  const idOrdenCompra = Number(params.get('idOrdenCompra')) || undefined
  const { data: datos, isLoading, isError, refetch } = useFacturas(
    estado ? { idOrdenCompra, page: 0, size: 1000 } : { idOrdenCompra, page: pagina, size: tamano },
  )
  const filtradas = estado ? (datos?.content ?? []).filter((f) => estadoReal(f) === estado) : null
  const data = datos && (filtradas
    ? { ...datos, content: filtradas.slice(pagina * tamano, (pagina + 1) * tamano), totalElements: filtradas.length, totalPages: Math.max(1, Math.ceil(filtradas.length / tamano)) }
    : datos)
  const facturas = data?.content ?? []

  const [pagando, setPagando] = useState<Factura | null>(null)
  const [anulando, setAnulando] = useState<Factura | null>(null)
  const [enviando, setEnviando] = useState<Factura | null>(null)
  const registrarPago = useRegistrarPago()
  const anular = useAnularFactura()
  const subirArchivo = useSubirArchivoFactura()
  const [subiendoId, setSubiendoId] = useState<number | null>(null)
  const mensajeError = (err: unknown) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? ''
  const { reset: resetPago } = registrarPago
  const cerrarPago = useCallback(() => { setPagando(null); resetPago() }, [resetPago])
  const cerrarAnular = useCallback(() => setAnulando(null), [])

  function subirDocumento(f: Factura, archivo: File | undefined) {
    if (!archivo) return
    setErrorAccion(null)
    setSubiendoId(idDe(f))
    subirArchivo.mutate(
      { id: idDe(f), archivo },
      {
        onError: (err) => setErrorAccion(`No se pudo subir el documento de ${codigoDe(f)}. ${mensajeError(err)}`.trim()),
        onSettled: () => setSubiendoId(null),
      },
    )
  }

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

      {idOrdenCompra && (
        <FiltroActivo verTodas="/facturacion">
          Comprobantes de la orden <span className="font-medium tabular-nums">{facturas[0]?.numeroOrdenCompra ?? `#${idOrdenCompra}`}</span>
        </FiltroActivo>
      )}

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
          <Tabla titulo="Comprobantes" minWidth={780}>
            <thead>
              <tr>
                <Th>Comprobante</Th>
                <Th>Cliente</Th>
                <Th>Emitido</Th>
                <Th>Estado</Th>
                <Th alinear="derecha">Importe</Th>
                <Th><span className="sr-only">Acciones</span></Th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows columns={6} />
              ) : (
                facturas.map((f) => {
                  const real = estadoReal(f)
                  const puedePagar = permisos.registrarPago && real !== 'ANULADA' && real !== 'PAGADA' && saldoDe(f) > 0
                  const puedeAnular = permisos.anularFactura && real !== 'ANULADA' && real !== 'PAGADA' && (f.montoPagado ?? 0) === 0
                  const nota = notaCobro(f)
                  const tipo = f.tipoComprobante ?? f.tipo
                  const moneda = f.moneda ?? 'PEN'
                  return (
                    <tr key={idDe(f)} className={filaClass}>
                      <Td className="whitespace-nowrap">
                        <p className="font-medium tabular-nums">{codigoDe(f)}</p>
                        {tipo && <p className="text-xs text-muted-foreground">{TIPOS_COMPROBANTE[tipo] ?? tipo}</p>}
                      </Td>
                      <Td className="min-w-44 max-w-72">
                        <p className="line-clamp-2 font-medium" title={f.clienteNombre ?? f.cliente ?? undefined}>{f.clienteNombre ?? f.cliente ?? '—'}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">Orden {f.numeroOrdenCompra ?? `#${f.idOrdenCompra}`}</p>
                      </Td>
                      <Td className="whitespace-nowrap">
                        <p className="tabular-nums">{formatearFechaCorta(f.fechaEmision)}</p>
                        <p className={`text-xs tabular-nums ${nota ? nota.clase : 'text-muted-foreground'}`}>
                          {nota ? nota.texto : `Vence ${formatearFechaCorta(f.fechaVencimiento)}`}
                        </p>
                      </Td>
                      <Td>
                        {permisos.anularFactura ? <EstadoFacturaSelect
                          idFactura={idDe(f)}
                          estadoActual={real}
                          numero={codigoDe(f)}
                          puedeAnular={puedeAnular}
                          onAnular={() => setAnulando(f)}
                          onError={setErrorAccion}
                        /> : <EstadoBadge tono={estadoDe(ESTADOS_FACTURA, real).tono}>{estadoDe(ESTADOS_FACTURA, real).label}</EstadoBadge>}
                      </Td>
                      <Td alinear="derecha" className="whitespace-nowrap">
                        <p className="font-medium">{formatearMoneda(f.total ?? 0, moneda)}</p>
                        {/* Saldo solo si ya hubo pagos (si no, es igual al total y sobra). */}
                        {saldoDe(f) > 0 && saldoDe(f) < (f.total ?? 0) && (
                          <p className="text-xs text-warning-text">Saldo {formatearMoneda(saldoDe(f), moneda)}</p>
                        )}
                        {real === 'PAGADA' && <p className="text-xs text-success">Pagada</p>}
                      </Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                        {permisos.enviarFactura && real !== 'ANULADA' && (
                          <button
                            type="button"
                            onClick={() => setEnviando(f)}
                            aria-label={`Enviar ${codigoDe(f)} al cliente`}
                            title="Enviar al cliente"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Send className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
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
                        {(permisos.emitirFactura || permisos.registrarPago || permisos.anularFactura) && <MasAccionesFactura
                          codigo={codigoDe(f)}
                          urlDocumento={f.urlArchivo}
                          subiendo={subiendoId === idDe(f)}
                          puedePagar={puedePagar}
                          puedeAnular={puedeAnular}
                          onSubir={(archivo) => subirDocumento(f, archivo)}
                          onPagar={() => setPagando(f)}
                          onAnular={() => setAnulando(f)}
                        />}
                        </div>
                      </Td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </Tabla>
        )}
      </TablaCard>

      <RegistrarPagoDialog
        open={!!pagando}
        comprobante={pagando ? codigoDe(pagando) : ''}
        saldo={pagando ? saldoDe(pagando) : 0}
        moneda={pagando?.moneda ?? 'PEN'}
        isLoading={registrarPago.isPending}
        error={registrarPago.isError ? `No se pudo registrar el pago. ${mensajeError(registrarPago.error)}`.trim() : null}
        onCancel={cerrarPago}
        onConfirm={(pago) => {
          if (!pagando) return
          registrarPago.mutate({ id: idDe(pagando), pago }, { onSuccess: () => setPagando(null) })
        }}
      />

      {enviando && (
        <EnviarFacturaModal factura={enviando} codigo={codigoDe(enviando)} onClose={() => setEnviando(null)} />
      )}

      <ConfirmDialog
        open={!!anulando}
        title="Anular comprobante"
        description={anulando ? `¿Seguro que quieres anular ${codigoDe(anulando)}? Esta acción no se puede deshacer.` : ''}
        confirmLabel="Anular"
        isLoading={anular.isPending}
        onCancel={cerrarAnular}
        onConfirm={() => {
          if (!anulando) return
          setErrorAccion(null)
          anular.mutate(idDe(anulando), {
            onSuccess: () => setAnulando(null),
            onError: (err) => {
              setAnulando(null)
              setErrorAccion(`No se pudo anular ${codigoDe(anulando)}. ${mensajeError(err)}`.trim())
            },
          })
        }}
      />
    </div>
  )
}