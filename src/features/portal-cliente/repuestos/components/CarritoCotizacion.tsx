import { CheckCircle2, Loader2, Paperclip, ShoppingCart, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/formatters/currency"
import { estimado, faltaIdentificar, type ItemCarrito } from "../lib/carrito"

interface Props {
  items: ItemCarrito[]
  enviando: boolean
  error?: string
  onCantidad: (clave: string, cantidad: number) => void
  onQuitar: (clave: string) => void
  onEditar: (clave: string, cambios: Partial<ItemCarrito>) => void
  onSubirFoto: (clave: string, archivo: File) => void
  /** Clave del ítem cuya foto se está subiendo. */
  subiendoFoto?: string
  onEnviar: () => void
}

/** Carrito de cotización: no es una compra, crea una solicitud con todos los ítems. */
export function CarritoCotizacion({ items, enviando, error, onCantidad, onQuitar, onEditar, onSubirFoto, subiendoFoto, onEnviar }: Props) {
  const total = estimado(items)
  const pendientes = items.filter((i) => faltaIdentificar(i)).length
  return (
    <aside aria-labelledby="carrito-titulo" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6">
      <h2 id="carrito-titulo" className="flex items-center gap-2 font-semibold">
        <ShoppingCart className="h-5 w-5 text-accent" aria-hidden="true" />
        Tu pedido de cotización
        <span className="ml-auto text-sm font-normal text-muted-foreground">{items.length} {items.length === 1 ? "repuesto" : "repuestos"}</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Agrega repuestos para pedir una cotización de todos juntos.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.map((i) => (
            <li key={i.clave} className="flex flex-col gap-2 py-3">
              <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{i.descripcion}</p>
                {i.numeroParte && <p className="font-mono text-xs text-muted-foreground">{i.numeroParte}</p>}
                {i.precio != null && <p className="text-xs text-muted-foreground">{formatCurrency(i.precio, "PEN")} c/u (referencial)</p>}
              </div>
              <label className="sr-only" htmlFor={`cant-${i.clave}`}>Cantidad de {i.descripcion}</label>
              <input
                id={`cant-${i.clave}`}
                type="number"
                min={1}
                step={1}
                value={i.cantidad}
                onChange={(e) => onCantidad(i.clave, Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                className="h-9 w-16 rounded-md border border-input bg-background px-2 text-sm tabular-nums"
              />
              <button
                type="button"
                onClick={() => onQuitar(i.clave)}
                aria-label={`Quitar ${i.descripcion}`}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
              </div>
              {!i.idProducto && <Identificar item={i} onEditar={onEditar} onSubirFoto={onSubirFoto} subiendo={subiendoFoto === i.clave} />}
            </li>
          ))}
        </ul>
      )}
      {total != null && (
        <p className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total referencial</span>
          <span className="font-semibold tabular-nums">{formatCurrency(total, "PEN")}</span>
        </p>
      )}
      <p className="text-xs text-muted-foreground">Los precios son referenciales: te enviamos la cotización con precio y plazo confirmados.</p>
      {pendientes > 0 && (
        <p className="text-sm text-warning-text">
          {pendientes === 1 ? "A 1 repuesto le falta" : `A ${pendientes} repuestos les falta`} el N.º de parte con su marca, o una foto.
        </p>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button
        type="button"
        onClick={onEnviar}
        disabled={items.length === 0 || pendientes > 0 || enviando}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        {enviando && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
        Pedir cotización
      </button>
    </aside>
  )
}

/** Repuesto sin producto de la vitrina ("Volver a pedir"): N.º de parte con marca, o foto/plano (D-01). */
function Identificar({ item: i, onEditar, onSubirFoto, subiendo }: {
  item: ItemCarrito
  onEditar: Props["onEditar"]
  onSubirFoto: Props["onSubirFoto"]
  subiendo: boolean
}) {
  const falta = faltaIdentificar(i)
  const id = (c: string) => `${c}-${i.clave}`
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/60 p-2">
      <div className="flex flex-col gap-1">
        <label htmlFor={id("np")} className="text-xs font-medium">N.º de parte de {i.descripcion}</label>
        <input id={id("np")} value={i.numeroParte ?? ""} onChange={(e) => onEditar(i.clave, { numeroParte: e.target.value })}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm" />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={id("marca")} className="text-xs font-medium">Marca de {i.descripcion}</label>
        <input id={id("marca")} value={i.marca ?? ""} onChange={(e) => onEditar(i.clave, { marca: e.target.value })}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm" />
      </div>
      <div className="col-span-2 flex flex-wrap items-center gap-2 text-xs">
        {i.urlFoto ? (
          <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Foto adjunta</span>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-1 font-medium text-accent hover:underline">
            {subiendo ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />}
            o adjunta foto o plano de {i.descripcion}
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" disabled={subiendo}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onSubirFoto(i.clave, f); e.target.value = "" }} />
          </label>
        )}
        {falta && <span className="text-warning-text">{falta}</span>}
      </div>
    </div>
  )
}
