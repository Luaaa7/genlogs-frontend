import { useMemo, useState, type ReactNode } from "react"
import { ArrowDownAZ, ArrowDownWideNarrow, Check, ChevronDown, ChevronUp, LayoutGrid, Search } from "lucide-react"
import { cn } from "@/lib/utils/utils"
import { MARCAS_VISIBLES } from "../lib/catalogo"
import { slugMarca, type OrdenMarcas, type ResumenMarca } from "../lib/marcas"
import { LogoMarca } from "./LogoMarca"

interface Props {
  /** Todas las marcas que trae la API (cualquier orden). */
  marcas: ResumenMarca[]
  /** Repuestos de la categoría elegida, para la tarjeta «Todas las marcas». */
  total: number
  valor?: string
  onChange: (marca?: string) => void
}

const TARJETA =
  "group relative flex h-full w-full flex-col items-stretch gap-2 rounded-xl border p-2.5 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
const REPOSO =
  "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#2E6BA8]/60 hover:shadow-lg hover:shadow-[#1E3A5F]/10 dark:border-white/10 dark:bg-[#0F213D] dark:hover:border-[#60A5FA]/60 dark:hover:shadow-black/40 motion-reduce:hover:translate-y-0"
const ELEGIDA =
  "border-[#2E6BA8] bg-[#EAF2FB] shadow-md shadow-[#2E6BA8]/20 ring-2 ring-[#2E6BA8]/40 dark:border-[#60A5FA] dark:bg-[#123059] dark:ring-[#60A5FA]/40"

/**
 * Marcas en una cuadrícula de tarjetas con logotipo, nombre y cantidad de repuestos.
 * Se adapta al ancho, admite cualquier cantidad de marcas, se puede buscar y ordenar (por defecto, las que
 * más repuestos tienen primero). Con muchas marcas se pliega: «Ver todas las marcas (N)» la despliega entera,
 * y la marca elegida sigue a la vista aunque quede fuera.
 */
export function TarjetasMarca({ marcas, total, valor, onChange }: Props) {
  const [abiertas, setAbiertas] = useState(false)
  const [filtro, setFiltro] = useState("")
  const [orden, setOrden] = useState<OrdenMarcas>("repuestos")

  const ordenadas = useMemo(() => {
    const alfabetico = (a: ResumenMarca, b: ResumenMarca) => a.marca.localeCompare(b.marca, "es", { sensitivity: "base" })
    return [...marcas].sort(orden === "repuestos" ? (a, b) => b.n - a.n || alfabetico(a, b) : alfabetico)
  }, [marcas, orden])

  const texto = filtro.trim().toLowerCase()
  const coinciden = texto ? ordenadas.filter((m) => m.marca.toLowerCase().includes(texto)) : ordenadas
  const plegable = !texto && coinciden.length > MARCAS_VISIBLES
  const visibles = !plegable || abiertas ? coinciden : coinciden.filter((m, i) => i < MARCAS_VISIBLES || m.marca === valor)

  return (
    <section aria-labelledby="marcas-titulo" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 id="marcas-titulo" className="mr-auto text-base font-semibold text-[#183153] dark:text-foreground">
          Marcas <span className="text-sm font-normal tabular-nums text-muted-foreground">({marcas.length})</span>
        </h2>
        <label className="relative">
          <span className="sr-only">Buscar marca</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar marca"
            className="h-9 w-40 rounded-lg border border-slate-200 bg-white pl-8 pr-2 text-sm placeholder:text-muted-foreground focus-visible:border-[#2E6BA8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:bg-white/[0.04] sm:w-48"
          />
        </label>
        <div role="group" aria-label="Ordenar marcas" className="inline-flex h-9 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-white/10 dark:bg-white/[0.04]">
          <BotonOrden activo={orden === "repuestos"} onClick={() => setOrden("repuestos")} icono={<ArrowDownWideNarrow className="h-4 w-4" />} texto="Más repuestos" />
          <BotonOrden activo={orden === "alfabetico"} onClick={() => setOrden("alfabetico")} icono={<ArrowDownAZ className="h-4 w-4" />} texto="A–Z" />
        </div>
      </div>

      <div role="group" aria-label="Filtrar por marca">
        <ul id="marcas-cuadricula" className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(7.75rem,1fr))] sm:gap-3">
          {!texto && (
            <li>
              <button
                type="button"
                aria-pressed={!valor}
                aria-label="Todas las marcas"
                aria-describedby="marca-n-todas"
                onClick={() => onChange(undefined)}
                className={cn(TARJETA, !valor ? ELEGIDA : REPOSO)}
              >
                <span aria-hidden="true" className="flex h-16 w-full items-center justify-center rounded-lg bg-gradient-to-br from-[#1E3A5F] to-[#2E6BA8] text-white">
                  <LayoutGrid className="h-7 w-7" />
                </span>
                <Pie id="marca-n-todas" nombre="Todas" n={total} />
                {!valor && <Marcada />}
              </button>
            </li>
          )}
          {visibles.map(({ marca, n }) => {
            const elegida = marca === valor
            const idConteo = `marca-n-${slugMarca(marca)}`
            return (
              <li key={marca}>
                <button
                  type="button"
                  aria-pressed={elegida}
                  aria-label={marca}
                  aria-describedby={idConteo}
                  title={marca}
                  onClick={() => onChange(elegida ? undefined : marca)}
                  className={cn(TARJETA, elegida ? ELEGIDA : REPOSO, n === 0 && !elegida && "opacity-55")}
                >
                  <LogoMarca marca={marca} className="transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
                  <Pie id={idConteo} nombre={marca} n={n} />
                  {elegida && <Marcada />}
                </button>
              </li>
            )
          })}
        </ul>
        {texto && coinciden.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-muted-foreground dark:border-white/10">
            Ninguna marca coincide con «{filtro.trim()}».
          </p>
        )}
      </div>

      {plegable && (
        <button
          type="button"
          onClick={() => setAbiertas((a) => !a)}
          aria-expanded={abiertas}
          aria-controls="marcas-cuadricula"
          className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#1E3A5F] shadow-sm hover:border-[#2E6BA8]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:bg-white/[0.04] dark:text-[#93C5FD]"
        >
          {abiertas ? "Ver menos marcas" : `Ver todas las marcas (${coinciden.length})`}
          {abiertas ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
        </button>
      )}
    </section>
  )
}

function Pie({ id, nombre, n }: { id: string; nombre: string; n: number }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate text-[13px] font-semibold leading-tight text-[#183153] dark:text-slate-100">{nombre}</span>
      <span id={id} className="text-[11px] tabular-nums text-muted-foreground">
        {n} {n === 1 ? "repuesto" : "repuestos"}
      </span>
    </span>
  )
}

function Marcada() {
  return (
    <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#2E6BA8] text-white shadow ring-2 ring-white dark:bg-[#3B82F6] dark:ring-[#0B1830]">
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  )
}

function BotonOrden({ activo, onClick, icono, texto }: { activo: boolean; onClick: () => void; icono: ReactNode; texto: string }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        activo ? "bg-[#1E3A5F] text-white dark:bg-[#2563EB]" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span aria-hidden="true">{icono}</span>
      {texto}
    </button>
  )
}
