import React, { useMemo, useState } from 'react'
import { FileText, FlaskConical, Loader2, Trash2, X } from 'lucide-react'
import { useCrearFactura, useEmitirFactura, useSubirArchivoFactura, useSunatConfig, useTiposComprobante } from '../hooks/useFacturacion'
import { avisar } from '@/lib/avisos'
import type { CotizacionDetalle } from '@/types/cotizacion.types'

interface RegistrarFacturaModalProps {
  isOpen: boolean
  onClose: () => void
  idOrdenCompra: number
  numeroOrdenCompra?: string
  idCondicionPago: number
  idMoneda: number
  /** Líneas de la cotización: se precargan y el usuario puede editarlas o quitarlas. */
  detalles: CotizacionDetalle[]
}

interface LineaEditable {
  clave: number
  idProducto?: number
  idServicio?: number
  nombre: string
  cantidad: string
  precio: string
  descuento: number
}

const SERIE = /^[A-Z][0-9]{3}$/
const NUMERO = /^[0-9]{1,8}$/

const campo =
  'mt-1 block w-full rounded-md border border-border p-2 text-sm shadow-sm focus:border-accent focus:outline-none'

function hoyLocal(): string {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

function mensajeDe(err: unknown, porDefecto: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? porDefecto
}

/**
 * Dos formas de dar de alta el comprobante:
 * - "Emitir desde GENLOGS": el sistema pone serie y número y lo manda al emisor
 *   configurado (hoy SIMULADO: no llega a SUNAT y el PDF lleva marca de agua).
 * - "Registrar uno ya emitido": se copia la serie y número del portal de SUNAT y se
 *   sube su documento.
 * En ambos, las líneas vienen precargadas de la cotización y se pueden editar.
 */
export const RegistrarFacturaModal: React.FC<RegistrarFacturaModalProps> = ({
  isOpen,
  onClose,
  idOrdenCompra,
  numeroOrdenCompra,
  idCondicionPago,
  idMoneda,
  detalles,
}) => {
  const { data: tipos = [] } = useTiposComprobante()
  const { mutateAsync: crear, isPending: creando } = useCrearFactura()
  const { mutateAsync: subir, isPending: subiendo } = useSubirArchivoFactura()
  const { mutateAsync: emitirFactura, isPending: emitiendo } = useEmitirFactura()
  const { data: sunat } = useSunatConfig()

  const lineasIniciales = useMemo<LineaEditable[]>(
    () =>
      detalles
        .filter((d) => d.idProducto != null || d.idServicio != null)
        .map((d, i) => ({
          clave: i,
          idProducto: d.idProducto ?? undefined,
          idServicio: d.idServicio ?? undefined,
          nombre: d.producto ?? d.servicio ?? d.descripcionPersonalizada ?? 'Ítem',
          cantidad: String(d.cantidad),
          precio: String(d.precioUnitario),
          descuento: d.descuentoUnitario ?? 0,
        })),
    [detalles],
  )

  const [idTipo, setIdTipo] = useState<number | null>(null)
  const [serie, setSerie] = useState<string | null>(null)
  const [numero, setNumero] = useState('')
  const [fecha, setFecha] = useState(hoyLocal())
  const [archivo, setArchivo] = useState<File | null>(null)
  const [lineas, setLineas] = useState<LineaEditable[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [idCreada, setIdCreada] = useState<number | null>(null)
  const [forma, setForma] = useState<'emitir' | 'registrar'>('emitir')

  if (!isOpen) return null

  const lineasActuales = lineas ?? lineasIniciales
  const emitir = forma === 'emitir'
  // Desde GENLOGS solo se emiten facturas y boletas; las notas se registran con su documento.
  const tiposVisibles = emitir ? tipos.filter((t) => t.codigoTipo === 'FACTURA' || t.codigoTipo === 'BOLETA') : tipos
  const tipoElegido =
    tiposVisibles.find((t) => t.idTipoComprobante === idTipo) ?? tiposVisibles.find((t) => t.codigoTipo === 'FACTURA') ?? tiposVisibles[0]
  const serieActual = serie ?? (tipoElegido ? `${tipoElegido.seriePrefijo}001` : '')
  const serieEmision = tipoElegido?.codigoTipo === 'BOLETA' ? sunat?.serieBoleta ?? 'B001' : sunat?.serieFactura ?? 'F001'
  const simulado = sunat?.simulado ?? true
  const ocupado = creando || subiendo || emitiendo

  const cambiarLinea = (clave: number, cambios: Partial<LineaEditable>) =>
    setLineas(lineasActuales.map((l) => (l.clave === clave ? { ...l, ...cambios } : l)))

  const subirDocumento = async (id: number) => {
    if (!archivo) return true
    try {
      await subir({ id, archivo })
      return true
    } catch (err) {
      setError(
        `La factura ya quedó registrada, pero el documento no se pudo subir. ${mensajeDe(err, '')} Puedes volver a intentarlo.`.trim(),
      )
      return false
    }
  }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Si la factura ya se creó y solo falló el documento, se reintenta únicamente la subida.
    if (idCreada) {
      if (await subirDocumento(idCreada)) onClose()
      return
    }

    if (!tipoElegido) return setError('Aún no se cargaron los tipos de comprobante. Inténtalo de nuevo.')
    if (!emitir && !SERIE.test(serieActual.trim())) return setError('La serie debe ser una letra y tres números, por ejemplo F001.')
    if (!emitir && !NUMERO.test(numero.trim())) return setError('El número del comprobante debe tener entre 1 y 8 dígitos.')
    if (lineasActuales.length === 0) return setError('La factura necesita al menos un ítem.')
    for (const l of lineasActuales) {
      if (!(Number(l.cantidad) > 0)) return setError(`La cantidad de "${l.nombre}" debe ser mayor que 0.`)
      if (!(Number(l.precio) >= 0) || l.precio.trim() === '') return setError(`Revisa el precio de "${l.nombre}".`)
    }

    const lineasPayload = lineasActuales.map((l) => ({
      idProducto: l.idProducto,
      idServicio: l.idServicio,
      cantidad: Number(l.cantidad),
      precioUnitario: Number(l.precio),
      descuentoUnitario: l.descuento || undefined,
    }))

    if (emitir) {
      try {
        const factura = await emitirFactura({
          idOrdenCompra,
          idTipoComprobante: tipoElegido.idTipoComprobante,
          idCondicionPago,
          idMoneda,
          fechaEmision: fecha || undefined,
          lineas: lineasPayload,
        })
        avisar(`${tipoElegido.nombreTipo} ${factura.codigoComprobante ?? ''} emitida${factura.sunatModo === 'SIMULADO' ? ' (simulación)' : ''}`.replace(/\s+/g, ' '))
        onClose()
      } catch (err) {
        setError(mensajeDe(err, 'No se pudo emitir el comprobante. Revisa los datos e inténtalo de nuevo.'))
      }
      return
    }

    try {
      const factura = await crear({
        idOrdenCompra,
        idTipoComprobante: tipoElegido.idTipoComprobante,
        idCondicionPago,
        idMoneda,
        serieComprobante: serieActual.trim(),
        numeroComprobante: numero.trim(),
        fechaEmision: fecha || undefined,
        lineas: lineasPayload,
      })
      const id = factura.idFacturacion ?? factura.id
      if (id) setIdCreada(id)
      if (!id || (await subirDocumento(id))) onClose()
    } catch (err) {
      setError(mensajeDe(err, 'No se pudo registrar la factura. Revisa los datos e inténtalo de nuevo.'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="my-auto w-full max-w-2xl rounded-lg bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-semibold text-foreground">{emitir ? 'Emitir comprobante' : 'Registrar factura'}</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div role="radiogroup" aria-label="Cómo dar de alta el comprobante" className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {([
            ['emitir', 'Emitir desde GENLOGS', 'El sistema pone la serie y el número.'],
            ['registrar', 'Registrar uno ya emitido', 'Lo emitiste en el portal de SUNAT.'],
          ] as const).map(([valor, titulo, ayuda]) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={forma === valor}
              disabled={ocupado || idCreada !== null}
              onClick={() => { setForma(valor); setIdTipo(null); setSerie(null); setError(null) }}
              className={`rounded-lg border p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                forma === valor ? 'border-accent bg-accent/5' : 'border-border hover:bg-muted'
              }`}
            >
              <span className="block font-medium text-foreground">{titulo}</span>
              <span className="block text-xs text-muted-foreground">{ayuda}</span>
            </button>
          ))}
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {emitir
            ? `Se emitirá como ${serieEmision}-(siguiente número)${numeroOrdenCompra ? ` para la orden ${numeroOrdenCompra}` : ''}.`
            : `Registra el comprobante que ya emitió SUNAT${numeroOrdenCompra ? ` para la orden ${numeroOrdenCompra}` : ''}.`}
        </p>

        {emitir && simulado && (
          <p className="mt-3 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-text">
            <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <strong>Modo simulación:</strong> no se envía a SUNAT y no tiene valor tributario. El PDF sale con la marca de agua
              “SIMULACIÓN”.
            </span>
          </p>
        )}

        <form onSubmit={enviar} className="mt-4 space-y-4">
          <fieldset disabled={ocupado || idCreada !== null} className="space-y-4">
            <div className={`grid grid-cols-1 gap-4 ${emitir ? '' : 'sm:grid-cols-3'}`}>
              <div>
                <label htmlFor="fa-tipo" className="block text-sm font-medium text-foreground">Tipo de comprobante</label>
                <select
                  id="fa-tipo"
                  className={campo}
                  value={tipoElegido?.idTipoComprobante ?? ''}
                  onChange={(e) => {
                    setIdTipo(Number(e.target.value))
                    setSerie(null)
                  }}
                >
                  {tiposVisibles.map((t) => (
                    <option key={t.idTipoComprobante} value={t.idTipoComprobante}>{t.nombreTipo}</option>
                  ))}
                </select>
              </div>
              {!emitir && (<>
              <div>
                <label htmlFor="fa-serie" className="block text-sm font-medium text-foreground">
                  Serie <span className="text-destructive">*</span>
                </label>
                <input id="fa-serie" value={serieActual} onChange={(e) => setSerie(e.target.value.toUpperCase())} maxLength={4} className={campo} placeholder="F001" />
              </div>
              <div>
                <label htmlFor="fa-numero" className="block text-sm font-medium text-foreground">
                  Número <span className="text-destructive">*</span>
                </label>
                <input id="fa-numero" value={numero} onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))} maxLength={8} inputMode="numeric" className={campo} placeholder="00000001" />
              </div>
              </>)}
            </div>
            {!emitir && (
              <p className="-mt-2 text-xs text-muted-foreground">Serie y número tal como salen en el documento de SUNAT (F001-00000001).</p>
            )}

            <div>
              <label htmlFor="fa-fecha" className="block text-sm font-medium text-foreground">Fecha de emisión</label>
              <input id="fa-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={campo} />
            </div>

            <div>
              <p className="text-sm font-medium text-foreground">Ítems (precargados de la cotización, puedes editarlos)</p>
              <ul className="mt-2 space-y-2">
                {lineasActuales.map((l) => (
                  <li key={l.clave} className="grid grid-cols-[minmax(0,1fr)_5rem_7rem_2rem] items-center gap-2 rounded-md border border-border p-2">
                    <span className="truncate text-sm" title={l.nombre}>{l.nombre}</span>
                    <input
                      aria-label={`Cantidad de ${l.nombre}`}
                      type="number"
                      min="0"
                      step="any"
                      value={l.cantidad}
                      onChange={(e) => cambiarLinea(l.clave, { cantidad: e.target.value })}
                      className="w-full rounded-md border border-border p-1.5 text-right text-sm"
                    />
                    <input
                      aria-label={`Precio unitario de ${l.nombre}`}
                      type="number"
                      min="0"
                      step="any"
                      value={l.precio}
                      onChange={(e) => cambiarLinea(l.clave, { precio: e.target.value })}
                      className="w-full rounded-md border border-border p-1.5 text-right text-sm"
                    />
                    <button
                      type="button"
                      aria-label={`Quitar ${l.nombre}`}
                      onClick={() => setLineas(lineasActuales.filter((x) => x.clave !== l.clave))}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {!emitir && (
            <div>
              <label htmlFor="fa-archivo" className="block text-sm font-medium text-foreground">
                Documento de SUNAT <span className="text-muted-foreground">(PDF, opcional)</span>
              </label>
              <input
                id="fa-archivo"
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-sm"
              />
              {archivo && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" aria-hidden="true" /> {archivo.name}
                </p>
              )}
            </div>
            )}
          </fieldset>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={ocupado} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
              {idCreada ? 'Cerrar' : 'Cancelar'}
            </button>
            <button type="submit" disabled={ocupado} className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50">
              {ocupado && <Loader2 className="h-4 w-4 animate-spin" />}
              {idCreada ? 'Reintentar subida' : emitir ? (simulado ? 'Emitir (simulación)' : 'Emitir') : 'Registrar factura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}