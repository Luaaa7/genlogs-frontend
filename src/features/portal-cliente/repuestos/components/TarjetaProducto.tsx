import type { CSSProperties } from "react"
import { Check, Clock, Plus, ShieldCheck } from "lucide-react"
import { formatCurrency } from "@/lib/formatters/currency"
import { textoPlazoEntrega } from "@/lib/plazoEntrega"
import { cn } from "@/lib/utils/utils"
import { ENTRADA_TARJETA } from "../../lib/estilosTarjeta"
import type { RepuestoPortal } from "../repuestosApi"
import { partesNombre } from "../lib/marcas"
import { LogoMarca } from "./LogoMarca"
import { tipoIlustracion } from "../lib/ilustracion"
import { IlustracionCategoria } from "./Ilustraciones"

const TIPO = { OEM: "Original (OEM)", ALTERNATIVO: "Alternativo compatible" } as const

interface Props {
  repuesto: RepuestoPortal
  /** Cantidad que ya está en el pedido de cotización (0 si no está). */
  enPedido: number
  onAgregar: () => void
  style?: CSSProperties
}

/**
 * Repuesto de la vitrina. Con `urlImagen` muestra la foto real; sin foto, una composición técnica
 * (dibujo de la familia de la categoría sobre retícula + logotipo de la marca), nunca una foto inventada.
 */
export function TarjetaProducto({ repuesto: r, enPedido, onAgregar, style }: Props) {
  const { titulo, numeroParte } = partesNombre(r)
  return (
    <li
      style={style}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#1E3A5F]/10 dark:bg-[#0F213D] dark:hover:shadow-black/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        enPedido > 0 ? "border-[#2E6BA8]/70 ring-1 ring-[#2E6BA8]/30 dark:border-[#60A5FA]/60" : "border-slate-200 hover:border-[#2E6BA8]/40 dark:border-white/10",
        ENTRADA_TARJETA,
      )}
    >
      <div className={cn("relative overflow-hidden border-b border-slate-200 dark:border-white/10", r.urlImagen ? "h-32" : "h-24")}>
        {r.urlImagen ? (
          <div className="flex h-full items-center justify-center bg-white p-3">
            <img src={r.urlImagen} alt={r.nombre} loading="lazy" className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
          </div>
        ) : (
          <div className="relative h-full [background-image:linear-gradient(rgba(30,58,95,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(30,58,95,.06)_1px,transparent_1px),linear-gradient(135deg,#EEF3F8,#DCE7F3)] [background-size:16px_16px,16px_16px,100%_100%] dark:[background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(135deg,#132A4A,#0B1A33)]">
            <IlustracionCategoria
              tipo={tipoIlustracion(r.categoria)}
              className="absolute inset-y-1.5 right-2 w-1/2 text-[#2E6BA8]/45 transition-transform duration-300 group-hover:scale-105 dark:text-[#60A5FA]/40 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            {r.marca && (
              <LogoMarca marca={r.marca} className="absolute bottom-2.5 left-3 h-11 w-[44%] py-1.5 shadow-sm" />
            )}
          </div>
        )}
        <span className="absolute left-3 top-2.5 max-w-[62%] truncate rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2E6BA8] shadow-sm ring-1 ring-slate-200 dark:bg-[#0B1830]/90 dark:text-[#93C5FD] dark:ring-white/10">
          {r.categoria}
        </span>
        {enPedido > 0 && (
          <span className="absolute right-3 top-2.5 inline-flex items-center gap-1 rounded-full bg-[#2E6BA8] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm dark:bg-[#3B82F6]">
            <Check className="h-3 w-3" aria-hidden="true" /> En tu pedido · {enPedido}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {r.marca && <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{r.marca}</p>}
        <h2 className="mt-1 text-base font-semibold leading-snug text-[#183153] dark:text-slate-50">{titulo}</h2>
        {numeroParte && (
          <p className="mt-1 text-xs text-muted-foreground">
            N.º de parte <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 dark:bg-white/10 dark:text-slate-200">{numeroParte}</span>
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            {TIPO[r.tipoRepuesto]}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10">
            <Clock className="h-3 w-3" aria-hidden="true" /> {textoPlazoEntrega(r.plazoEntrega)}
          </span>
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-3 dark:border-white/10">
            <p className={cn("font-bold leading-tight tabular-nums text-[#183153] dark:text-slate-50", r.precioReferencial != null ? "text-base" : "whitespace-nowrap text-sm")}>
              {r.precioReferencial != null ? formatCurrency(r.precioReferencial, "PEN") : "Precio a consultar"}
              {r.precioReferencial != null && <span className="block text-[11px] font-normal text-muted-foreground">precio referencial</span>}
            </p>
            <button
              type="button"
              onClick={onAgregar}
              aria-label={`Agregar ${r.nombre} al pedido`}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#2E6BA8] px-4 text-sm font-semibold text-white shadow-sm shadow-[#2E6BA8]/30 transition-colors hover:bg-[#1E5A94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {enPedido > 0 ? "Sumar" : "Agregar"}
            </button>
          </div>
        </div>
      </div>
    </li>
  )
}
