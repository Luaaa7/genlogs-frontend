import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils/utils"

interface SelectorMarcaProps {
  marcas: string[]
  /** Marca elegida; sin valor = todas. */
  valor?: string
  onChange: (marca?: string) => void
  /** Id del texto que nombra el control (para lectores de pantalla). */
  etiquetaId: string
}

interface Opcion {
  valor?: string
  label: string
}

/** Sin mayúsculas ni tildes, para que "siemens" encuentre "Siemens". */
function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

/** Lista desplegable con buscador para elegir una marca (reemplaza los botones de marca). */
export function SelectorMarca({ marcas, valor, onChange, etiquetaId }: SelectorMarcaProps) {
  const [abierto, setAbierto] = useState(false)
  const [filtro, setFiltro] = useState("")
  const [activo, setActivo] = useState(0)
  const raiz = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const buscador = useRef<HTMLInputElement>(null)
  const id = useId()
  const idLista = `${id}-lista`

  const opciones = useMemo<Opcion[]>(() => {
    const f = normalizar(filtro)
    const coinciden = marcas.filter((m) => normalizar(m).includes(f))
    return [{ label: "Todas las marcas" }, ...coinciden.map((m) => ({ valor: m, label: m }))]
  }, [marcas, filtro])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!abierto) return
    function alClicFuera(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener("mousedown", alClicFuera)
    return () => document.removeEventListener("mousedown", alClicFuera)
  }, [abierto])

  // Al abrir, el foco va al buscador
  useEffect(() => {
    if (abierto) buscador.current?.focus()
  }, [abierto])

  function abrir() {
    setFiltro("")
    setActivo(0)
    setAbierto(true)
  }

  function elegir(opcion: Opcion) {
    onChange(opcion.valor)
    setAbierto(false)
    boton.current?.focus()
  }

  function alTeclear(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActivo((i) => Math.min(i + 1, opciones.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActivo((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const opcion = opciones[activo]
      if (opcion) elegir(opcion)
    } else if (e.key === "Escape") {
      e.preventDefault()
      setAbierto(false)
      boton.current?.focus()
    }
  }

  return (
    <div ref={raiz} className="relative w-full sm:w-72">
      <button
        ref={boton}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-labelledby={`${etiquetaId} ${id}-valor`}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span id={`${id}-valor`} className={cn("truncate", !valor && "text-muted-foreground")}>
          {valor ?? "Todas las marcas"}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", abierto && "rotate-180")} aria-hidden="true" />
      </button>

      {abierto && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              ref={buscador}
              type="text"
              role="combobox"
              aria-label="Buscar marca"
              aria-expanded="true"
              aria-controls={idLista}
              aria-activedescendant={opciones[activo] ? `${id}-op-${activo}` : undefined}
              value={filtro}
              onChange={(e) => {
                setFiltro(e.target.value)
                setActivo(0)
              }}
              onKeyDown={alTeclear}
              placeholder="Buscar marca…"
              className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <ul id={idLista} role="listbox" aria-labelledby={etiquetaId} className="max-h-64 overflow-y-auto py-1">
            {opciones.map((o, i) => {
              const elegida = o.valor === valor
              return (
                <li
                  key={o.valor ?? "todas"}
                  id={`${id}-op-${i}`}
                  role="option"
                  aria-selected={elegida}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => elegir(o)}
                  onMouseEnter={() => setActivo(i)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm",
                    i === activo && "bg-muted",
                    elegida && "font-semibold text-accent",
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {elegida && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </li>
              )
            })}
          </ul>
          {opciones.length === 1 && filtro && (
            <p className="border-t border-border px-3 py-2 text-sm text-muted-foreground">No hay marcas con «{filtro}».</p>
          )}
        </div>
      )}
    </div>
  )
}