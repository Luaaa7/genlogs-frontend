import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Ventana } from '@/components/ui/Ventana'
import { Button } from '@/components/ui/button'
import { MarcaObligatorio } from '@/components/ui/campo'
import { inputFormClass } from '@/components/ui/campoEstilos'
import { formatearMoneda, calcularSubtotal } from '@/lib/formatters/codigoCotizacion'
import { SelectorCatalogoItem, type ItemCatalogo } from './SelectorCatalogoItem'

export interface ItemNuevo {
  producto: string
  idProducto?: number
  idServicio?: number
  idUnidadMedida?: number
  cantidad: number
  precioUnitario: number
  margenPorcentaje: number
  subtotal: number
}

interface Props {
  moneda: string
  onAgregar: (item: ItemNuevo) => void
  onCerrar: () => void
}

/** Ventana para sumar un ítem a la cotización: se busca en el catálogo, se
 *  indican cantidad, precio y margen, y recién entonces entra a la lista. */
export function AgregarItemModal({ moneda, onAgregar, onCerrar }: Props) {
  const [texto, setTexto] = useState('')
  const [item, setItem] = useState<ItemCatalogo | null>(null)
  const [cantidad, setCantidad] = useState('1')
  const [precio, setPrecio] = useState('')
  const [margen, setMargen] = useState('0')
  const [intento, setIntento] = useState(false)
  const [agregados, setAgregados] = useState(0)

  const cant = Number(cantidad)
  const prec = Number(precio)
  const marg = Number(margen)
  const faltantes = [
    !item && 'producto o servicio',
    !(cant >= 1) && 'cantidad (mínimo 1)',
    !(prec > 0) && 'precio unitario',
    !(marg >= 0 && marg <= 100) && 'margen entre 0 y 100',
  ].filter(Boolean) as string[]

  function reiniciar() {
    setTexto('')
    setItem(null)
    setCantidad('1')
    setPrecio('')
    setMargen('0')
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
      cantidad: cant,
      precioUnitario: prec,
      margenPorcentaje: marg,
      subtotal: calcularSubtotal(cant, prec),
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
      descripcion="Busca el producto o servicio en el catálogo e indica cantidad y precio."
      onCerrar={onCerrar}
      ancho="max-w-xl"
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
        <div>
          <span className="mb-1 block text-sm font-medium text-foreground">Producto o servicio<MarcaObligatorio /></span>
          <SelectorCatalogoItem
            valor={texto}
            seleccionado={item !== null}
            onEscribir={(t) => { setTexto(t); setItem(null) }}
            onSeleccionar={(i) => { setItem(i); setTexto(i.nombre) }}
            ariaLabel="Producto o servicio del ítem nuevo"
            invalido={err(!item)}
          />
          {err(!item) && <p className="mt-1 text-xs text-destructive">Busca y elige un producto o servicio de la lista.</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-medium text-foreground">
            Cantidad<MarcaObligatorio />
            <input type="number" min={1} step={1} inputMode="numeric" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
              aria-invalid={err(!(cant >= 1))} className={`${inputFormClass} mt-1 text-right tabular-nums`} />
            {err(!(cant >= 1)) && <span className="mt-1 block text-xs font-normal text-destructive">Mínimo 1.</span>}
          </label>
          <label className="block text-sm font-medium text-foreground">
            Precio unitario<MarcaObligatorio />
            <input type="number" min={0} step="0.01" inputMode="decimal" placeholder="0.00" value={precio} onChange={(e) => setPrecio(e.target.value)}
              aria-invalid={err(!(prec > 0))} className={`${inputFormClass} mt-1 text-right tabular-nums`} />
            {err(!(prec > 0)) && <span className="mt-1 block text-xs font-normal text-destructive">Debe ser mayor a 0.</span>}
          </label>
          <label className="block text-sm font-medium text-foreground">
            Margen %
            <input type="number" min={0} max={100} step="0.1" inputMode="decimal" value={margen} onChange={(e) => setMargen(e.target.value)}
              aria-invalid={err(!(marg >= 0 && marg <= 100))} className={`${inputFormClass} mt-1 text-right tabular-nums`} />
            {err(!(marg >= 0 && marg <= 100)) && <span className="mt-1 block text-xs font-normal text-destructive">Entre 0 y 100.</span>}
          </label>
        </div>
        <p className="flex justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">Subtotal del ítem</span>
          <span className="font-semibold tabular-nums">{formatearMoneda(calcularSubtotal(cant || 0, prec || 0), moneda)}</span>
        </p>
        {intento && faltantes.length > 0 && (
          <p role="alert" className="text-sm text-destructive">Falta completar: {faltantes.join(', ')}.</p>
        )}
      </div>
    </Ventana>
  )
}
