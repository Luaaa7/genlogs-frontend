import { Loader2, ShoppingCart, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/formatters/currency"
import { estimado, type ItemCarrito } from "../lib/carrito"

interface Props {
  items: ItemCarrito[]
  enviando: boolean
  error?: string
  onCantidad: (clave: string, cantidad: number) => void
  onQuitar: (clave: string) => void
  onEnviar: () => void
}

/** Carrito de cotización: no es una compra, crea una solicitud con todos los ítems. */
export function CarritoCotizacion({ items, enviando, error, onCantidad, onQuitar, onEnviar }: Props) {
  const total = estimado(items)
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
            <li key={i.clave} className="flex items-start gap-3 py-3">
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
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button
        type="button"
        onClick={onEnviar}
        disabled={items.length === 0 || enviando}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        {enviando && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
        Pedir cotización
      </button>
    </aside>
  )
}
