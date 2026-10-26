import { useId, useMemo, useState } from "react"
import { MapPin, Search, X } from "lucide-react"
import type { Distrito } from "@/api/distritosApi"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/utils"

interface DistritoSelectorProps {
  /** id del input: lo une con el <label> del Campo. */
  id?: string
  /** ids de la ayuda y el error del Campo (describedBy). */
  describedBy?: string
  invalid?: boolean
  distritos: Distrito[] | undefined
  isLoading: boolean
  value: number | undefined
  onChange: (idDistrito: number) => void
  className?: string
  disabled?: boolean
}

const MAX_RESULTADOS = 8

const normalizar = (s?: string | null) =>
  (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()

/**
 * Distrito escrito a mano en vez de una lista desplegable larga: se escribe el
 * distrito, la provincia, el departamento o el UBIGEO y se elige de las
 * coincidencias. El elegido se muestra en detalle (distrito, provincia,
 * departamento y UBIGEO). Tiene que salir del catálogo porque el tercero
 * guarda el id del distrito.
 */
export function DistritoSelector({
  id,
  describedBy,
  invalid,
  distritos = [],
  isLoading,
  value,
  onChange,
  className,
  disabled = false,
}: DistritoSelectorProps) {
  const [texto, setTexto] = useState("")
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const [cambiando, setCambiando] = useState(false)
  const listaId = useId()

  const seleccionado = distritos.find((d) => d.idDistrito === value)
  const consulta = normalizar(texto)

  const resultados = useMemo(() => {
    if (!consulta) return []
    return distritos
      .filter((d) =>
        [d.nombreDistrito, d.nombreProvincia, d.nombreDepartamento, d.ubigeo].some((v) => normalizar(v).includes(consulta))
      )
      // Primero los que empiezan por lo escrito en el nombre del distrito
      .sort((a, b) => Number(!normalizar(a.nombreDistrito).startsWith(consulta)) - Number(!normalizar(b.nombreDistrito).startsWith(consulta)))
      .slice(0, MAX_RESULTADOS)
  }, [distritos, consulta])

  function elegir(d: Distrito) {
    onChange(d.idDistrito)
    setTexto("")
    setAbierto(false)
    setCambiando(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setAbierto(true)
      setActivo((i) => Math.min(i + 1, Math.max(resultados.length - 1, 0)))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActivo((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      // Enter elige el resaltado y NO envía el formulario
      if (abierto && resultados[activo]) {
        e.preventDefault()
        elegir(resultados[activo])
      }
    } else if (e.key === "Escape") {
      setAbierto(false)
      if (seleccionado) setCambiando(false)
    }
  }

  // Distrito ya elegido: detalle completo y botón para cambiarlo.
  if (seleccionado && !cambiando) {
    return (
      <div className="w-full rounded-md border border-input bg-background px-3 py-2.5">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <dl className="grid min-w-0 flex-1 grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
            <dt className="text-muted-foreground">Distrito</dt>
            <dd className="font-medium text-foreground">{seleccionado.nombreDistrito}</dd>
            <dt className="text-muted-foreground">Provincia</dt>
            <dd>{seleccionado.nombreProvincia || "—"}</dd>
            <dt className="text-muted-foreground">Departamento</dt>
            <dd>{seleccionado.nombreDepartamento || "—"}</dd>
            <dt className="text-muted-foreground">UBIGEO</dt>
            <dd className="tabular-nums">{seleccionado.ubigeo || "—"}</dd>
          </dl>
          <Button
            id={id}
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-describedby={describedBy}
            onClick={() => setCambiando(true)}
            aria-label={`Cambiar distrito (${seleccionado.nombreDistrito})`}
          >
            Cambiar
          </Button>
        </div>
      </div>
    )
  }

  const placeholder = isLoading
    ? "Cargando distritos..."
    : disabled
    ? "Catálogo no disponible"
    : "Escribe el distrito, la provincia o el departamento"

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={abierto && consulta !== ""}
          aria-controls={listaId}
          aria-autocomplete="list"
          aria-activedescendant={abierto && resultados[activo] ? `${listaId}-${resultados[activo].idDistrito}` : undefined}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          autoFocus={cambiando}
          disabled={isLoading || disabled}
          value={texto}
          placeholder={placeholder}
          onChange={(e) => {
            setTexto(e.target.value)
            setAbierto(true)
            setActivo(0)
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 150)}
          onKeyDown={onKeyDown}
          className={cn(className, "pl-9", seleccionado && "pr-10")}
        />
        {seleccionado && (
          <button
            type="button"
            onClick={() => {
              setTexto("")
              setCambiando(false)
            }}
            aria-label="Cancelar el cambio de distrito"
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {abierto && consulta !== "" && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg">
          {resultados.length > 0 ? (
            <ul id={listaId} role="listbox" aria-label="Distritos" className="max-h-72 overflow-y-auto py-1">
              {resultados.map((d, i) => (
                <li
                  key={d.idDistrito}
                  id={`${listaId}-${d.idDistrito}`}
                  role="option"
                  aria-selected={i === activo}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    elegir(d)
                  }}
                  onMouseEnter={() => setActivo(i)}
                  className={cn("cursor-pointer px-3 py-2 text-sm", i === activo ? "bg-muted" : "hover:bg-muted")}
                >
                  <span className="block font-medium text-foreground">{d.nombreDistrito}</span>
                  <span className="block text-xs text-muted-foreground">
                    Provincia {d.nombreProvincia || "—"} · Departamento {d.nombreDepartamento || "—"}
                    {d.ubigeo ? ` · UBIGEO ${d.ubigeo}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p id={listaId} className="px-3 py-3 text-sm text-muted-foreground">
              Ningún distrito del catálogo coincide con "{texto.trim()}". Si es fuera del Perú, escribe "Extranjero".
            </p>
          )}
        </div>
      )}
    </div>
  )
}