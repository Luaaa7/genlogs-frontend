import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils/utils"

export interface ChipFiltro<T extends string> {
  valor: T
  label: string
  /** Cantidad real; sin datos todavía se omite. */
  n?: number
  Icono?: LucideIcon
}

interface Props<T extends string> {
  etiqueta: string
  opciones: ChipFiltro<T>[]
  valor: T
  onChange: (valor: T) => void
}

const CHIP =
  "inline-flex h-9 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
const ACTIVO = "border-[#2E6BA8] bg-[#2E6BA8] text-white shadow-sm shadow-[#2E6BA8]/30 dark:border-[#3B82F6] dark:bg-[#2563EB]"
const REPOSO =
  "border-slate-200 bg-white text-slate-700 hover:border-[#2E6BA8]/50 hover:text-[#1E3A5F] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-[#60A5FA]/50 dark:hover:bg-white/[0.08]"

/**
 * Chips de filtro del portal, iguales a los de Repuestos: icono, etiqueta y cantidad.
 * El nombre accesible es «Etiqueta (n)», igual que antes del rediseño.
 * En móvil se desplazan de lado; en pantallas medianas se acomodan en filas.
 */
export function ChipsFiltroPortal<T extends string>({ etiqueta, opciones, valor, onChange }: Props<T>) {
  return (
    <div
      role="group"
      aria-label={etiqueta}
      className="-mx-4 flex snap-x items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {opciones.map(({ valor: v, label, n, Icono }) => {
        const activa = v === valor
        return (
          <button
            key={v}
            type="button"
            aria-pressed={activa}
            aria-label={n === undefined ? label : `${label} (${n})`}
            onClick={() => onChange(v)}
            className={cn(CHIP, activa ? ACTIVO : REPOSO)}
          >
            {Icono && <Icono className={cn("h-4 w-4", activa ? "text-white" : "text-[#2E6BA8] dark:text-[#60A5FA]")} aria-hidden="true" />}
            {label}
            {n !== undefined && (
              <span aria-hidden="true" className={cn("rounded-full px-1.5 text-xs tabular-nums", activa ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300")}>
                {n}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
