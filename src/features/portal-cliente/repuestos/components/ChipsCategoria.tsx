import { useEffect, useRef, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { ChevronDown, Cog, Cpu, Factory, Filter, Gauge, LayoutGrid, Tag, Wrench, Zap } from "lucide-react"
import { cn } from "@/lib/utils/utils"

export interface OpcionCategoria {
  valor: string
  label: string
  n: number
}

/** Icono según el nombre de la categoría (las categorías vienen del backend; si no coincide, una etiqueta). */
function iconoCategoria(label: string): LucideIcon {
  const t = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  if (t.includes("valvul")) return Gauge
  if (t.includes("automat") || t.includes("control")) return Cpu
  if (t.includes("fabric")) return Factory
  if (t.includes("filtro")) return Filter
  if (t.includes("electr")) return Zap
  if (t.includes("herramient")) return Wrench
  if (t.includes("componente") || t.includes("accesorio") || t.includes("rodamiento")) return Cog
  return Tag
}

/** Chips visibles antes de «Más» (sin contar «Todas»). */
export const CATEGORIAS_VISIBLES = 5

interface Props {
  opciones: OpcionCategoria[]
  total: number
  valor?: string
  onChange: (valor?: string) => void
}

const CHIP =
  "inline-flex h-9 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
const ACTIVO = "border-[#2E6BA8] bg-[#2E6BA8] text-white shadow-sm shadow-[#2E6BA8]/30 dark:border-[#3B82F6] dark:bg-[#2563EB]"
const REPOSO = "border-slate-200 bg-white text-slate-700 hover:border-[#2E6BA8]/50 hover:text-[#1E3A5F] dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-[#60A5FA]/50 dark:hover:bg-white/[0.08]"

/** Categorías en chips compactos con icono y cantidad; las que no caben pasan a «Más». */
export function ChipsCategoria({ opciones, total, valor, onChange }: Props) {
  const visibles = opciones.slice(0, CATEGORIAS_VISIBLES)
  const resto = opciones.slice(CATEGORIAS_VISIBLES)
  const elegidaEnResto = resto.find((o) => o.valor === valor)

  return (
    <div
      role="group"
      aria-label="Filtrar por categoría"
      className="-mx-4 flex snap-x items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <Chip label="Todas" n={total} Icono={LayoutGrid} activa={!valor} onClick={() => onChange(undefined)} />
      {visibles.map((o) => (
        <Chip key={o.valor} label={o.label} n={o.n} Icono={iconoCategoria(o.label)} activa={o.valor === valor} onClick={() => onChange(o.valor)} />
      ))}
      {resto.length > 0 && <MenuMas opciones={resto} valor={valor} elegida={elegidaEnResto} onChange={onChange} />}
    </div>
  )
}

function Chip({ label, n, Icono, activa, onClick }: { label: string; n: number; Icono: LucideIcon; activa: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={activa} onClick={onClick} className={cn(CHIP, activa ? ACTIVO : REPOSO)}>
      <Icono className={cn("h-4 w-4", activa ? "text-white" : "text-[#2E6BA8] dark:text-[#60A5FA]")} aria-hidden="true" />
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 text-xs tabular-nums",
          activa ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300",
        )}
      >
        {n}
      </span>
    </button>
  )
}

function MenuMas({ opciones, valor, elegida, onChange }: { opciones: OpcionCategoria[]; valor?: string; elegida?: OpcionCategoria; onChange: (v?: string) => void }) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => { if (!caja.current?.contains(e.target as Node)) setAbierto(false) }
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false) }
    document.addEventListener("mousedown", fuera)
    document.addEventListener("keydown", tecla)
    return () => {
      document.removeEventListener("mousedown", fuera)
      document.removeEventListener("keydown", tecla)
    }
  }, [abierto])

  return (
    <div ref={caja} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls="categorias-mas"
        onClick={() => setAbierto((a) => !a)}
        className={cn(CHIP, elegida ? ACTIVO : REPOSO)}
      >
        {elegida ? elegida.label : "Más"}
        <ChevronDown className={cn("h-4 w-4 transition-transform", abierto && "rotate-180")} aria-hidden="true" />
      </button>
      {abierto && (
        <ul id="categorias-mas" className="absolute left-0 top-11 z-30 min-w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#0F2442]">
          {opciones.map((o) => {
            const Icono = iconoCategoria(o.label)
            return (
              <li key={o.valor}>
                <button
                  type="button"
                  aria-pressed={o.valor === valor}
                  onClick={() => { onChange(o.valor); setAbierto(false) }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-white/10"
                >
                  <Icono className="h-4 w-4 text-[#2E6BA8] dark:text-[#60A5FA]" aria-hidden="true" />
                  <span className="flex-1">{o.label}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{o.n}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
