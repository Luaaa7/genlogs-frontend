import { useEffect, useRef } from "react"
import { CheckCircle2, Loader2, Minus, Package, Paperclip, Plus, ShoppingCart, Trash2, X } from "lucide-react"
import { formatCurrency } from "@/lib/formatters/currency"
import { cn } from "@/lib/utils/utils"
import { BotonCargando } from "../../components/BotonCargando"
import { estimado, faltaIdentificar, type ItemCarrito } from "../lib/carrito"
import { LogoMarca } from "./LogoMarca"
import { IlustracionCarritoVacio } from "./Ilustraciones"

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
  /** Móvil: el carrito se abre como panel inferior desde la barra fija. En escritorio siempre está visible. */
  abiertoMovil?: boolean
  onCerrarMovil?: () => void
}

const BOTON_ICONO =
  "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"

/**
 * Carrito de cotización: no es una compra, crea una solicitud con todos los ítems.
 * Escritorio: columna fija a la derecha. Móvil: panel inferior que se abre desde la barra del pedido.
 */
export function CarritoCotizacion({
  items, enviando, error, onCantidad, onQuitar, onEditar, onSubirFoto, subiendoFoto, onEnviar, abiertoMovil = false, onCerrarMovil,
}: Props) {
  const total = estimado(items)
  const pendientes = items.filter((i) => faltaIdentificar(i)).length
  const unidades = items.reduce((t, i) => t + i.cantidad, 0)
  const cerrar = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (abiertoMovil) cerrar.current?.focus()
  }, [abiertoMovil])

  return (
    <aside
      id="carrito-cotizacion"
      aria-labelledby="carrito-titulo"
      className={cn(
        "flex flex-col gap-4 border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0F213D]",
        "lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:rounded-2xl lg:shadow-sm",
        abiertoMovil
          ? "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-50 max-lg:max-h-[85dvh] max-lg:overflow-y-auto max-lg:rounded-t-2xl max-lg:pb-[max(1.25rem,env(safe-area-inset-bottom))] max-lg:shadow-2xl max-lg:animate-[tarjeta-entra_0.25s_ease-out] motion-reduce:animate-none"
          : "max-lg:hidden",
      )}
    >
      <span aria-hidden="true" className="mx-auto -mt-2 h-1.5 w-10 rounded-full bg-border lg:hidden" />
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2E6BA8] text-white shadow-sm shadow-[#2E6BA8]/30 dark:bg-[#2563EB]">
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FACC15] px-1 text-[11px] font-bold text-[#183153] tabular-nums">
              {items.length}
            </span>
          )}
        </span>
        <h2 id="carrito-titulo" className="min-w-0 flex-1 font-semibold leading-tight">
          Tu pedido de cotización
          <span className="block text-sm font-normal text-muted-foreground">
            {items.length} {items.length === 1 ? "repuesto" : "repuestos"}
            {items.length > 0 && ` · ${unidades} ${unidades === 1 ? "unidad" : "unidades"}`}
          </span>
        </h2>
        {onCerrarMovil && (
          <button ref={cerrar} type="button" onClick={onCerrarMovil} aria-label="Cerrar tu pedido" className={cn(BOTON_ICONO, "h-9 w-9 lg:hidden")}>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-gradient-to-b from-[#EEF3F8] to-transparent px-4 pb-2 pt-5 text-center dark:from-white/[0.04]">
          <IlustracionCarritoVacio className="max-w-[13rem]" />
          <p className="text-sm text-muted-foreground">Agrega repuestos para pedir una cotización de todos juntos.</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.map((i) => (
            <li key={i.clave} className="flex flex-col gap-2 py-3 first:pt-0">
              <div className="flex items-start gap-3">
                {i.marca?.trim() ? (
                  <LogoMarca marca={i.marca} variante="chip" />
                ) : (
                  <span aria-hidden="true" className="flex h-8 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-accent">
                    <Package className="h-4 w-4" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{i.descripcion}</p>
                  {i.numeroParte && <p className="font-mono text-xs text-muted-foreground">{i.numeroParte}</p>}
                  {i.precio != null && <p className="text-xs text-muted-foreground">{formatCurrency(i.precio, "PEN")} c/u (referencial)</p>}
                </div>
                <button type="button" onClick={() => onQuitar(i.clave)} aria-label={`Quitar ${i.descripcion}`} className={BOTON_ICONO}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex items-center justify-between gap-3 pl-[3.75rem]">
                <div className="inline-flex items-center rounded-lg border border-input bg-background">
                  <button
                    type="button"
                    onClick={() => onCantidad(i.clave, Math.max(1, i.cantidad - 1))}
                    disabled={i.cantidad <= 1}
                    aria-label={`Restar una unidad a ${i.descripcion}`}
                    className={BOTON_ICONO}
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <label className="sr-only" htmlFor={`cant-${i.clave}`}>Cantidad de {i.descripcion}</label>
                  <input
                    id={`cant-${i.clave}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={i.cantidad}
                    onChange={(e) => onCantidad(i.clave, Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                    className="h-8 w-12 border-0 bg-transparent px-1 text-center text-sm tabular-nums [appearance:textfield] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => onCantidad(i.clave, i.cantidad + 1)}
                    aria-label={`Sumar una unidad a ${i.descripcion}`}
                    className={BOTON_ICONO}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                {i.precio != null && (
                  <span className="text-sm font-semibold tabular-nums text-[#183153] dark:text-slate-100">{formatCurrency(Math.round(i.precio * i.cantidad * 100) / 100, "PEN")}</span>
                )}
              </div>
              {!i.idProducto && <Identificar item={i} onEditar={onEditar} onSubirFoto={onSubirFoto} subiendo={subiendoFoto === i.clave} />}
            </li>
          ))}
        </ul>
      )}
      {total != null && (
        <p className="flex items-baseline justify-between rounded-xl bg-muted/50 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Total referencial</span>
          <span className="text-lg font-bold tabular-nums">{formatCurrency(total, "PEN")}</span>
        </p>
      )}
      <p className="text-xs text-muted-foreground">Te enviamos la cotización con precio y plazo confirmados.</p>
      {pendientes > 0 && (
        <p className="text-sm text-warning-text">
          {pendientes === 1 ? "A 1 repuesto le falta" : `A ${pendientes} repuestos les falta`} el N.º de parte con su marca, o una foto.
        </p>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <BotonCargando
        type="button"
        onClick={onEnviar}
        cargando={enviando}
        textoCargando="Enviando pedido..."
        disabled={items.length === 0 || pendientes > 0}
        className="h-12 w-full rounded-xl bg-[#2E6BA8] text-base font-semibold shadow-md shadow-[#2E6BA8]/30 hover:bg-[#1E5A94] dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8]"
      >
        Pedir cotización
      </BotonCargando>
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
