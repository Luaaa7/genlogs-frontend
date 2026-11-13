import { useState } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import { Ventana } from '@/components/ui/Ventana'
import { Button } from '@/components/ui/button'
import { MarcaObligatorio } from '@/components/ui/campo'
import { inputFormClass } from '@/components/ui/campoEstilos'
import { formatearMoneda, calcularSubtotal } from '@/lib/formatters/codigoCotizacion'
import { SelectorCatalogoItem, type ItemCatalogo } from './SelectorCatalogoItem'
import { RepuestoRapidoModal } from './RepuestoRapidoModal'
import { usePermisos } from '@/lib/permisos'
import { useEscalaMargenes } from '@/features/configuracion/hooks/useMargenes'
import { MARGEN_MAXIMO, margenDesdePrecio, precioDesdeCosto, reglaProducto, reglaServicio, textoPorcentaje } from '@/lib/margenes'

export interface ItemNuevo {
  producto: string
  idProducto?: number
  idServicio?: number
  idUnidadMedida?: number
  tipoItem: 'producto' | 'servicio'
  cantidad: number
  costoUnitario: number
  margenPorcentaje: number
  margenMinimo?: number
  precioUnitario: number
  subtotal: number
}

interface Props {
  moneda: string
  onAgregar: (item: ItemNuevo) => void
  onCerrar: () => void
}

/** Ventana para sumar un ítem a la cotización: se busca en el catálogo, se
 *  indican cantidad y costo, el margen sale de la escala (se puede cambiar) y
 *  con eso se calcula el precio de venta. Recién entonces entra a la lista. */
export function AgregarItemModal({ moneda, onAgregar, onCerrar }: Props) {
  const [tipo, setTipo] = useState<'producto' | 'servicio'>('producto')
  const [texto, setTexto] = useState('')
  const [item, setItem] = useState<ItemCatalogo | null>(null)
  const [cantidad, setCantidad] = useState('1')
  const [costo, setCosto] = useState('')
  // Margen escrito a mano; mientras sea null se usa el sugerido por la escala.
  const [margenManual, setMargenManual] = useState<string | null>(null)
  // Precio estándar del servicio elegido (precio referencial del catálogo).
  const [precioEstandar, setPrecioEstandar] = useState<number | null>(null)
  const [intento, setIntento] = useState(false)
  const [agregados, setAgregados] = useState(0)
  const [creandoRepuesto, setCreandoRepuesto] = useState(false)
  const { editarCatalogos } = usePermisos()
  const { data: escala } = useEscalaMargenes()

  const cant = Number(cantidad)
  const cost = Number(costo)
  // Regla de la escala: productos por costo, servicios por categoría.
  const regla = !item
    ? null
    : item.tipo === 'producto'
      ? (cost > 0 ? reglaProducto(escala, cost) : null)
      : reglaServicio(escala, item.idCategoriaServicio, item.idCategoriaPadre)
  // Con precio estándar (y sin margen escrito a mano) el precio de venta es el del
  // servicio y el margen sale del costo. Si se escribe otro margen, manda el margen.
  const usaPrecioEstandar = precioEstandar !== null && margenManual === null
  const margenTexto = margenManual
    ?? (usaPrecioEstandar ? (cost > 0 ? String(margenDesdePrecio(cost, precioEstandar)) : '')
      : regla ? String(regla.sugerido) : '0')
  const marg = Number(margenTexto)
  const precioVenta = usaPrecioEstandar ? precioEstandar : precioDesdeCosto(cost, marg)
  const bajoMinimo = regla !== null && marg < regla.minimo
  const faltantes = [
    !item && (tipo === 'producto' ? 'repuesto' : 'servicio'),
    !(cant >= 1) && 'cantidad (mínimo 1)',
    !(cost > 0) && 'costo unitario',
    !(marg >= 0 && marg <= MARGEN_MAXIMO) && `margen entre 0 y ${MARGEN_MAXIMO}`,
  ].filter(Boolean) as string[]

  // Al elegir un servicio sale su precio estándar como precio de venta y, si el rol
  // lo puede ver, su costo. Todo se puede cambiar para esta cotización.
  function elegirItem(i: ItemCatalogo) {
    setItem(i)
    setTexto(i.nombre)
    setMargenManual(null)
    const precioServicio = i.tipo === 'servicio' ? Number(i.precioReferencial) : 0
    setPrecioEstandar(precioServicio > 0 ? precioServicio : null)
    const costoServicio = i.tipo === 'servicio' ? Number(i.costo) : 0
    if (costoServicio > 0) setCosto(String(costoServicio))
  }

  function reiniciar() {
    setTexto('')
    setItem(null)
    setPrecioEstandar(null)
    setCantidad('1')
    setCosto('')
    setMargenManual(null)
    setIntento(false)
  }

  // Al cambiar de pestaña se empieza de cero: un repuesto y un servicio no se mezclan.
  function cambiarTipo(nuevo: 'producto' | 'servicio') {
    if (nuevo === tipo) return
    setTipo(nuevo)
    setTexto('')
    setItem(null)
    setPrecioEstandar(null)
    setMargenManual(null)
    setIntento(false)
  }

  function agregar(seguir: boolean) {
    setIntento(true)
    if (faltantes.length > 0 || !item) return
    onAgregar({
      producto: item.nombre,
      idProducto: item.tipo === 'producto' ? item.id : undefined,
      idServicio: item.tipo === 'servicio' ? item.id : undefined,
      idUnidadMedida: item.idUnidadMedida,
      tipoItem: item.tipo,
      cantidad: cant,
      costoUnitario: cost,
      margenPorcentaje: marg,
      margenMinimo: regla?.minimo,
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

  return (
    <Ventana
      titulo="Agregar ítem"
      descripcion="Elige si es un repuesto o un servicio, búscalo e indica la cantidad y el costo: el margen se sugiere según la escala."
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
        <div role="tablist" aria-label="Tipo de ítem" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {(['producto', 'servicio'] as const).map((t) => (
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
              {t === 'producto' ? 'Producto' : 'Servicio'}
            </button>
          ))}
        </div>
        <div role="tabpanel">
          <span className="mb-1 block text-sm font-medium text-foreground">{tipo === 'producto' ? 'Repuesto' : 'Servicio'}<MarcaObligatorio /></span>
          <SelectorCatalogoItem
            key={tipo}
            tipo={tipo}
            valor={texto}
            seleccionado={item !== null}
            onEscribir={(t) => { setTexto(t); setItem(null); setPrecioEstandar(null) }}
            onSeleccionar={elegirItem}
            ariaLabel={tipo === 'producto' ? 'Repuesto del ítem nuevo' : 'Servicio del ítem nuevo'}
            invalido={err(!item)}
          />
          {err(!item) && <p className="mt-1 text-xs text-destructive">Busca y elige {tipo === 'producto' ? 'un repuesto' : 'un servicio'} de la lista.</p>}
          {editarCatalogos && !item && tipo === 'producto' && (
            <p className="mt-2 text-sm text-muted-foreground">
              ¿No está en el catálogo?{' '}
              <button type="button" onClick={() => setCreandoRepuesto(true)} className="font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                + Crear repuesto nuevo
              </button>
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-medium text-foreground">
            Cantidad<MarcaObligatorio />
            <input type="number" min={1} step={1} inputMode="numeric" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
              aria-invalid={err(!(cant >= 1))} className={`${inputFormClass} mt-1 text-right tabular-nums`} />
            {err(!(cant >= 1)) && <span className="mt-1 block text-xs font-normal text-destructive">Mínimo 1.</span>}
          </label>
          <label className="block text-sm font-medium text-foreground">
            Costo unitario<MarcaObligatorio />
            <input type="number" min={0} step="0.01" inputMode="decimal" placeholder="0.00" value={costo} onChange={(e) => setCosto(e.target.value)}
              aria-invalid={err(!(cost > 0))} className={`${inputFormClass} mt-1 text-right tabular-nums`} />
            {err(!(cost > 0)) && <span className="mt-1 block text-xs font-normal text-destructive">Debe ser mayor a 0.</span>}
          </label>
          <label className="block text-sm font-medium text-foreground">
            Margen %
            <input type="number" min={0} max={MARGEN_MAXIMO} step="0.1" inputMode="decimal" value={margenTexto} onChange={(e) => setMargenManual(e.target.value)}
              aria-invalid={err(!(marg >= 0 && marg <= MARGEN_MAXIMO))} aria-describedby="margen-ayuda" className={`${inputFormClass} mt-1 text-right tabular-nums`} />
            <span id="margen-ayuda" className="mt-1 block text-xs font-normal text-muted-foreground">
              {usaPrecioEstandar
                ? (cost > 0 ? 'Sale del precio estándar.' : 'Escribe el costo para calcularlo.')
                : regla
                  ? `Sugerido ${textoPorcentaje(regla.sugerido)} · mínimo ${textoPorcentaje(regla.minimo)}`
                  : item?.tipo === 'producto' ? 'Escribe el costo para sugerirlo.' : 'Según la escala de márgenes.'}
            </span>
            {margenManual !== null && (precioEstandar !== null || regla) && (
              <button type="button" onClick={() => setMargenManual(null)} className="mt-0.5 text-xs font-normal text-accent underline-offset-2 hover:underline">
                {precioEstandar !== null ? 'Usar el precio estándar' : 'Usar el sugerido'}
              </button>
            )}
          </label>
        </div>
        {precioEstandar !== null && (
          <p role="status" className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">
            Precio estándar del servicio: <strong className="tabular-nums">{formatearMoneda(precioEstandar, moneda)}</strong>.
            {' '}{Number(item?.costo) > 0 ? 'El costo también viene del catálogo.' : 'Escribe el costo para calcular el margen.'} Puedes cambiarlos para esta cotización.
          </p>
        )}
        {bajoMinimo && (
          <p role="alert" className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-text">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            El margen está por debajo del mínimo para este ítem ({textoPorcentaje(regla?.minimo ?? 0)}). Revísalo antes de cotizar.
          </p>
        )}
        <dl className="grid grid-cols-[1fr_auto] gap-y-1 border-t border-border pt-3 text-sm">
          <dt className="text-muted-foreground">Precio de venta unitario</dt>
          <dd className="text-right font-medium tabular-nums">{formatearMoneda(precioVenta, moneda)}</dd>
          <dt className="text-muted-foreground">Ganancia por unidad</dt>
          <dd className="text-right tabular-nums text-success">{formatearMoneda(Math.max(precioVenta - (cost || 0), 0), moneda)}</dd>
        </dl>
        <p className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal del ítem</span>
          <span className="font-semibold tabular-nums">{formatearMoneda(calcularSubtotal(cant || 0, precioVenta), moneda)}</span>
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