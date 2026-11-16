import { useState } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import type { Referencia } from '@/api/sourcingApi'
import { Ventana } from '@/components/ui/Ventana'
import { Button } from '@/components/ui/button'
import { MarcaObligatorio } from '@/components/ui/campo'
import { inputFormClass } from '@/components/ui/campoEstilos'
import { formatearMoneda, calcularSubtotal } from '@/lib/formatters/codigoCotizacion'
import { SelectorCatalogoItem, type ItemCatalogo } from './SelectorCatalogoItem'
import { HistorialItemPanel } from './HistorialItemPanel'
import { RepuestoRapidoModal } from './RepuestoRapidoModal'
import { usePermisos } from '@/lib/permisos'
import { useEscalaMargenes } from '@/features/configuracion/hooks/useMargenes'
import { normalizarMoneda } from '@/lib/formatters/currency'
import { MARGEN_MAXIMO, margenDesdePrecio, precioDesdeCosto, reglaProducto, reglaServicio, textoPorcentaje } from '@/lib/margenes'

export interface ItemNuevo {
  producto: string
  idProducto?: number
  idServicio?: number
  idUnidadMedida?: number
  tipoItem: 'producto' | 'servicio'
  cantidad: number
  costoUnitario?: number
  margenPorcentaje?: number
  margenMinimo?: number
  precioUnitario: number
  subtotal: number
}

interface Props {
  moneda: string
  /** Soles por 1 dólar, el del día en un alta o el guardado en un borrador. null: no convertir. */
  tipoCambio?: number | null
  onAgregar: (item: ItemNuevo) => void
  onCerrar: () => void
}

type Pestana = 'producto' | 'servicio' | 'historial'

const AVISO_COSTO = 'El costo cambió. Se mantuvo el precio y se recalculó el margen.'

function redondear2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Solo PEN y USD. Sin cambio y monedas distintas, no convierte y no inventa 1. */
function convertir(monto: number, desde: string, hacia: string, tc: number | null): number | null {
  if (!(monto > 0)) return null
  const origen = normalizarMoneda(desde)
  const destino = normalizarMoneda(hacia)
  if (origen === destino) return redondear2(monto)
  if (tc == null || !(tc > 0)) return null
  if (origen === 'USD' && destino === 'PEN') return redondear2(monto * tc)
  if (origen === 'PEN' && destino === 'USD') return redondear2(monto / tc)
  return null
}

function textoReferencia(r: Referencia): string {
  return [r.titulo, r.marca, r.numeroParte].filter((p) => p && p.trim()).join(' · ')
}

/** Ventana para sumar un ítem: catálogo, texto libre o historial útil.
 *  Agregar solo lo mete al formulario; no guarda la cotización. */
export function AgregarItemModal({ moneda, tipoCambio = null, onAgregar, onCerrar }: Props) {
  const [tipo, setTipo] = useState<Pestana>('producto')
  const [texto, setTexto] = useState('')
  const [item, setItem] = useState<ItemCatalogo | null>(null)
  const [referencia, setReferencia] = useState<Referencia | null>(null)
  const [pideMoneda, setPideMoneda] = useState(false)
  const [montoRef, setMontoRef] = useState('')
  const [monedaCosto, setMonedaCosto] = useState<'' | 'PEN' | 'USD'>('')
  const [cantidad, setCantidad] = useState('1')
  const [costo, setCosto] = useState('')
  const [margenManual, setMargenManual] = useState<string | null>(null)
  const [precioEscrito, setPrecioEscrito] = useState<number | null>(null)
  const [avisoCosto, setAvisoCosto] = useState(false)
  const [sinCambio, setSinCambio] = useState(false)
  const [precioEstandar, setPrecioEstandar] = useState<number | null>(null)
  const [intento, setIntento] = useState(false)
  const [agregados, setAgregados] = useState(0)
  const [creandoRepuesto, setCreandoRepuesto] = useState(false)
  const { editarCatalogos } = usePermisos()
  const { data: escala } = useEscalaMargenes()
  const tc = tipoCambio != null && tipoCambio > 0 ? tipoCambio : null
  const monedaCot = normalizarMoneda(moneda) || 'PEN'
  const enDolares = monedaCot === 'USD'
  const aMoneda = (monto: number, desde: string) => convertir(monto, desde, monedaCot, tc)

  const cant = Number(cantidad)
  const cost = Number(costo)
  const libre = tipo === 'producto' && !item && texto.trim().length > 0
  const comoProducto = item?.tipo === 'producto' || libre || referencia !== null
  const regla = !comoProducto
    ? (item?.tipo === 'servicio' ? reglaServicio(escala, item.idCategoriaServicio, item.idCategoriaPadre) : null)
    : (cost > 0 ? reglaProducto(escala, cost) : null)
  const usaPrecioEstandar = precioEstandar !== null && margenManual === null && precioEscrito === null
  const margenTexto = margenManual
    ?? (usaPrecioEstandar ? (cost > 0 ? String(margenDesdePrecio(cost, precioEstandar)) : '')
      : cost > 0 && regla ? String(regla.sugerido) : '')
  const marg = margenTexto === '' ? Number.NaN : Number(margenTexto)
  const precioCalculado = usaPrecioEstandar ? precioEstandar : (cost > 0 && margenTexto !== '' ? precioDesdeCosto(cost, marg) : 0)
  const precioVenta = precioEscrito != null && precioEscrito > 0 ? precioEscrito : precioCalculado
  const hayMargen = margenTexto !== '' && !Number.isNaN(marg)
  const bajoMinimo = hayMargen && regla !== null && marg < regla.minimo
  const servicioConPrecio = item?.tipo === 'servicio' && (precioEstandar ?? 0) > 0
  const faltaCosto = !servicioConPrecio && !(cost > 0)
  const faltaMoneda = pideMoneda && monedaCosto === ''
  const haySeleccion = item !== null || libre || referencia !== null
  const faltantes = [
    !haySeleccion && (tipo === 'historial' ? 'referencia útil' : tipo === 'producto' ? 'repuesto o texto del ítem' : 'servicio'),
    !(cant >= 1) && 'cantidad (mínimo 1)',
    faltaMoneda && 'moneda del costo',
    faltaCosto && 'costo unitario',
    !(precioVenta > 0) && 'precio',
    hayMargen && !(marg >= 0 && marg <= MARGEN_MAXIMO) && `margen entre 0 y ${MARGEN_MAXIMO}`,
  ].filter(Boolean) as string[]

  function limpiarCalculo() {
    setMargenManual(null)
    setPrecioEscrito(null)
    setAvisoCosto(false)
    setSinCambio(false)
    setPrecioEstandar(null)
  }

  function ponerCosto(monto: number, desde: string) {
    const convertido = aMoneda(monto, desde)
    const otraMoneda = normalizarMoneda(desde) !== monedaCot
    setSinCambio(convertido == null && otraMoneda)
    setCosto(convertido == null ? '' : String(convertido))
  }

  function elegirItem(i: ItemCatalogo) {
    setItem(i)
    setReferencia(null)
    setPideMoneda(false)
    setTexto(i.nombre)
    limpiarCalculo()
    const sePuedeConvertir = !enDolares || tc !== null
    const precioServicio = i.tipo === 'servicio' && sePuedeConvertir ? Number(i.precioReferencial) : 0
    const precioEnMoneda = precioServicio > 0 ? aMoneda(precioServicio, 'PEN') : null
    setPrecioEstandar(precioEnMoneda)
    if (i.tipo === 'servicio') {
      const costoServicio = sePuedeConvertir ? Number(i.costo) : 0
      const costoEnMoneda = costoServicio > 0 ? aMoneda(costoServicio, 'PEN') : null
      setCosto(costoEnMoneda != null ? String(costoEnMoneda) : '')
    }
  }

  function elegirReferencia(r: Referencia) {
    if (r.estado !== 'UTIL') return
    setReferencia(r)
    setItem(null)
    setTexto(textoReferencia(r))
    limpiarCalculo()
    setMontoRef('')
    setMonedaCosto('')
    const puesto = Number(r.costoPuestoLima)
    const ref = r.precioRef
    if (puesto > 0) {
      setPideMoneda(false)
      ponerCosto(puesto, 'PEN')
    } else if (ref != null && Number(ref) > 0) {
      setPideMoneda(false)
      ponerCosto(Number(ref), r.codigoMoneda || '')
    } else {
      setPideMoneda(true)
      setCosto('')
    }
  }

  function alCambiarMontoRef(valor: string, monedaOrigen: '' | 'PEN' | 'USD') {
    setMontoRef(valor)
    setMonedaCosto(monedaOrigen)
    const n = Number(valor)
    if (!(n > 0) || monedaOrigen === '') {
      setCosto('')
      return
    }
    ponerCosto(n, monedaOrigen)
  }

  function alCambiarCosto(valor: string) {
    setCosto(valor)
    if (precioEscrito != null && precioEscrito > 0) {
      const c = Number(valor)
      if (c > 0) setMargenManual(String(margenDesdePrecio(c, precioEscrito)))
      setAvisoCosto(true)
    }
  }

  function alCambiarMargen(valor: string) {
    setMargenManual(valor)
    setPrecioEscrito(null)
    setAvisoCosto(false)
  }

  function alCambiarPrecio(valor: string) {
    setAvisoCosto(false)
    if (valor.trim() === '') {
      setPrecioEscrito(null)
      return
    }
    const n = Number(valor)
    setPrecioEscrito(n)
    if (cost > 0 && n > 0) setMargenManual(String(margenDesdePrecio(cost, n)))
  }

  function reiniciar() {
    setTexto('')
    setItem(null)
    setReferencia(null)
    setPideMoneda(false)
    setMontoRef('')
    setMonedaCosto('')
    setCantidad('1')
    setCosto('')
    limpiarCalculo()
    setIntento(false)
  }

  function cambiarTipo(nuevo: Pestana) {
    if (nuevo === tipo) return
    setTipo(nuevo)
    setTexto('')
    setItem(null)
    setReferencia(null)
    setPideMoneda(false)
    setMontoRef('')
    setMonedaCosto('')
    setPrecioEstandar(null)
    setCosto('')
    setMargenManual(null)
    setPrecioEscrito(null)
    setAvisoCosto(false)
    setSinCambio(false)
    setIntento(false)
  }

  function agregar(seguir: boolean) {
    setIntento(true)
    if (faltantes.length > 0 || !haySeleccion) return
    const nombre = item?.nombre ?? texto.trim()
    onAgregar({
      producto: nombre,
      idProducto: item?.tipo === 'producto' ? item.id : undefined,
      idServicio: item?.tipo === 'servicio' ? item.id : undefined,
      idUnidadMedida: item?.idUnidadMedida,
      tipoItem: item?.tipo ?? 'producto',
      cantidad: cant,
      ...(cost > 0 ? { costoUnitario: cost } : {}),
      ...(hayMargen ? { margenPorcentaje: marg, margenMinimo: regla?.minimo } : {}),
      precioUnitario: precioVenta,
      subtotal: calcularSubtotal(cant, precioVenta),
    })
    if (seguir) {
      setAgregados((n) => n + 1)
      reiniciar()
    } else {
      onCerrar()
    }
  }

  const err = (cond: boolean) => intento && cond
  const precioVisible = precioEscrito != null && String(precioEscrito) !== ''
    ? String(precioEscrito)
    : (precioVenta > 0 ? String(precioVenta) : '')

  return (
    <Ventana
      titulo="Agregar ítem"
      descripcion="Elige un repuesto, un servicio o una referencia útil. El precio se calcula con el costo y el margen, y también se puede escribir."
      onCerrar={onCerrar}
      ancho="max-w-xl"
      cerrable={!creandoRepuesto}
      acciones={
        <>
          <Button type="button" variant="ghost" onClick={onCerrar}>{agregados > 0 ? 'Listo' : 'Cancelar'}</Button>
          <Button type="button" variant="outline" onClick={() => agregar(true)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Agregar y añadir otro
          </Button>
          <Button type="button" onClick={() => agregar(false)}>Agregar ítem</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4" onKeyDown={(e) => e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type === 'number' && (e.preventDefault(), agregar(false))}>
        {agregados > 0 && (
          <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
            {agregados === 1 ? 'Se agregó 1 ítem a la cotización.' : `Se agregaron ${agregados} ítems a la cotización.`} Puedes añadir otro.
          </p>
        )}
        <div role="tablist" aria-label="Tipo de ítem" className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
          {(['producto', 'servicio', 'historial'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tipo === t}
              onClick={() => cambiarTipo(t)}
              className={`h-9 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                tipo === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'producto' ? 'Producto' : t === 'servicio' ? 'Servicio' : 'Historial'}
            </button>
          ))}
        </div>
        <div role="tabpanel">
          {tipo === 'historial' ? (
            <HistorialItemPanel onElegir={elegirReferencia} />
          ) : (
            <>
              <span className="mb-1 block text-sm font-medium text-foreground">{tipo === 'producto' ? 'Repuesto' : 'Servicio'}<MarcaObligatorio /></span>
              <SelectorCatalogoItem
                key={tipo}
                tipo={tipo}
                valor={texto}
                seleccionado={item !== null}
                onEscribir={(t) => { setTexto(t); setItem(null); setPrecioEstandar(null) }}
                onSeleccionar={elegirItem}
                ariaLabel={tipo === 'producto' ? 'Repuesto del ítem nuevo' : 'Servicio del ítem nuevo'}
                invalido={err(!item && !libre)}
              />
              {err(!item && !libre) && <p className="mt-1 text-xs text-destructive">Busca y elige {tipo === 'producto' ? 'un repuesto o escribe el texto del ítem' : 'un servicio'} de la lista.</p>}
              {editarCatalogos && !item && tipo === 'producto' && (
                <p className="mt-2 text-sm text-muted-foreground">
                  ¿No está en el catálogo?{' '}
                  <button type="button" onClick={() => setCreandoRepuesto(true)} className="font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    + Crear repuesto nuevo
                  </button>
                </p>
              )}
            </>
          )}
          {referencia && <p className="mt-2 text-sm text-foreground">{texto}</p>}
        </div>
        {pideMoneda && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-foreground">
              Costo de la referencia<MarcaObligatorio />
              <input type="number" min={0} step="0.01" inputMode="decimal" value={montoRef}
                onChange={(e) => alCambiarMontoRef(e.target.value, monedaCosto)}
                className={`${inputFormClass} mt-1 text-right tabular-nums`} />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Moneda del costo<MarcaObligatorio />
              <select value={monedaCosto} onChange={(e) => alCambiarMontoRef(montoRef, e.target.value as '' | 'PEN' | 'USD')}
                className={`${inputFormClass} mt-1`}>
                <option value="">Elige</option>
                <option value="PEN">PEN</option>
                <option value="USD">USD</option>
              </select>
            </label>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-foreground">
            Cantidad<MarcaObligatorio />
            <input type="number" min={1} step={1} inputMode="numeric" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
              aria-invalid={err(!(cant >= 1))} className={`${inputFormClass} mt-1 text-right tabular-nums`} />
            {err(!(cant >= 1)) && <span className="mt-1 block text-xs font-normal text-destructive">Mínimo 1.</span>}
          </label>
          <label className="block text-sm font-medium text-foreground">
            Costo unitario{servicioConPrecio ? '' : <MarcaObligatorio />}
            <input type="number" min={0} step="0.01" inputMode="decimal" placeholder="0.00" value={costo} onChange={(e) => alCambiarCosto(e.target.value)}
              aria-invalid={err(faltaCosto)} className={`${inputFormClass} mt-1 text-right tabular-nums`} />
            {err(faltaCosto) && <span className="mt-1 block text-xs font-normal text-destructive">Debe ser mayor a 0.</span>}
          </label>
          <label className="block text-sm font-medium text-foreground">
            Margen %
            <input type="number" min={0} max={MARGEN_MAXIMO} step="0.1" inputMode="decimal" value={margenTexto} onChange={(e) => alCambiarMargen(e.target.value)}
              aria-invalid={err(hayMargen && !(marg >= 0 && marg <= MARGEN_MAXIMO))} aria-describedby="margen-ayuda" className={`${inputFormClass} mt-1 text-right tabular-nums`} />
            <span id="margen-ayuda" className="mt-1 block text-xs font-normal text-muted-foreground">
              {usaPrecioEstandar
                ? (cost > 0 ? 'Sale del precio estándar.' : 'Escribe el costo para calcularlo.')
                : regla
                  ? `Sugerido ${textoPorcentaje(regla.sugerido)} · mínimo ${textoPorcentaje(regla.minimo)}`
                  : 'Escribe el costo para calcularlo.'}
            </span>
            {margenManual !== null && (precioEstandar !== null || regla) && (
              <button type="button" onClick={() => { setMargenManual(null); setPrecioEscrito(null); setAvisoCosto(false) }} className="mt-0.5 text-xs font-normal text-accent underline-offset-2 hover:underline">
                {precioEstandar !== null ? 'Usar el precio estándar' : 'Usar el sugerido'}
              </button>
            )}
          </label>
          <label className="block text-sm font-medium text-foreground">
            Precio de venta<MarcaObligatorio />
            <input type="number" min={0} step="0.01" inputMode="decimal" value={precioVisible} onChange={(e) => alCambiarPrecio(e.target.value)}
              className={`${inputFormClass} mt-1 text-right tabular-nums`} />
          </label>
        </div>
        {precioEstandar !== null && item?.tipo === 'servicio' && (
          <p role="status" className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">
            Precio estándar del servicio:{' '}
            <strong className="tabular-nums">{formatearMoneda(Number(item.precioReferencial), 'PEN')}</strong>
            {tc !== null && (
              <span className="tabular-nums text-muted-foreground"> (≈ {formatearMoneda(aMoneda(Number(item.precioReferencial), 'PEN') ?? 0, 'USD')} al tipo de cambio {tc.toFixed(3)})</span>
            )}
            .{' '}{Number(item.costo) > 0 ? 'El costo también viene del catálogo.' : 'Escribe el costo para calcular el margen.'} Puedes cambiarlos para esta cotización.
          </p>
        )}
        {enDolares && tc === null && item?.tipo === 'servicio' && Number(item.precioReferencial) > 0 && (
          <p role="status" className="rounded-md bg-warning/10 px-3 py-2 text-sm text-foreground">
            No hay tipo de cambio de hoy: escribe el costo en dólares. El precio del servicio es {formatearMoneda(Number(item.precioReferencial), 'PEN')}.
          </p>
        )}
        {sinCambio && (
          <p role="status" className="rounded-md bg-warning/10 px-3 py-2 text-sm text-foreground">
            No hay tipo de cambio de hoy: escribe el costo en la moneda de la cotización.
          </p>
        )}
        {avisoCosto && (
          <p role="status" className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">{AVISO_COSTO}</p>
        )}
        {bajoMinimo && (
          <p role="alert" className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-text">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            El margen está por debajo del mínimo para este ítem ({textoPorcentaje(regla?.minimo ?? 0)}). Revísalo antes de cotizar.
          </p>
        )}
        <dl className="grid grid-cols-[1fr_auto] gap-y-1 border-t border-border pt-3 text-sm">
          {cost > 0 && (
            <>
              <dt className="text-muted-foreground">Costo</dt>
              <dd className="text-right tabular-nums">{formatearMoneda(cost, moneda)}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Precio de venta unitario</dt>
          <dd className="text-right font-medium tabular-nums">{precioVenta > 0 ? formatearMoneda(precioVenta, moneda) : '—'}</dd>
          <dt className="text-muted-foreground">Ganancia por unidad</dt>
          <dd className="text-right tabular-nums text-success">{precioVenta > 0 ? formatearMoneda(Math.max(precioVenta - (cost || 0), 0), moneda) : '—'}</dd>
        </dl>
        <p className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal del ítem</span>
          <span className="font-semibold tabular-nums">{precioVenta > 0 ? formatearMoneda(calcularSubtotal(cant || 0, precioVenta), moneda) : '—'}</span>
        </p>
        {intento && faltantes.length > 0 && (
          <p role="alert" className="text-sm text-destructive">Falta completar: {faltantes.join(', ')}.</p>
        )}
      </div>
      {creandoRepuesto && (
        <RepuestoRapidoModal
          nombreInicial={texto.trim()}
          onCerrar={() => setCreandoRepuesto(false)}
          onCreado={(nuevo) => {
            setItem(nuevo)
            setTexto(nuevo.nombre)
            setCreandoRepuesto(false)
          }}
        />
      )}
    </Ventana>
  )
}
