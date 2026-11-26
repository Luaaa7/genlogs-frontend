import { useState } from "react"
import { DEPARTAMENTOS_PERU, VISTA_MAPA_PERU } from "../lib/mapaPeru"

interface Props {
  /** Unidades mineras activas por departamento (id del mapa → cantidad). */
  conteos: Record<string, number>
  /** Departamento que filtra la lista, o null. */
  seleccionado: string | null
  onSeleccionar: (id: string | null) => void
}

const unidades = (n: number) => (n === 1 ? "1 unidad" : `${n} unidades`)

/**
 * Mapa del Perú por departamentos, en SVG propio y sin librerías. Los departamentos con unidades
 * mineras activas van en el azul de GENLOGS y se pueden pulsar para filtrar la lista; el resto,
 * en gris suave. El nombre y la cantidad salen en una etiqueta discreta al pasar el cursor o enfocar.
 */
export function MapaPeru({ conteos, seleccionado, onSeleccionar }: Props) {
  const [enfocado, setEnfocado] = useState<string | null>(null)
  const idEtiqueta = enfocado ?? seleccionado
  const dep = DEPARTAMENTOS_PERU.find((d) => d.id === idEtiqueta)
  const etiqueta = dep
    ? `${dep.nombre}: ${(conteos[dep.id] ?? 0) > 0 ? unidades(conteos[dep.id]) : "sin unidades"}`
    : "Pasa el cursor sobre un departamento"

  return (
    <figure className="mx-auto w-full max-w-sm">
      <svg
        viewBox={`0 0 ${VISTA_MAPA_PERU.ancho} ${VISTA_MAPA_PERU.alto}`}
        role="group"
        aria-label="Mapa del Perú por departamentos"
        className="h-auto w-full"
      >
        {DEPARTAMENTOS_PERU.map((d) => {
          const n = conteos[d.id] ?? 0
          const activo = n > 0
          const elegido = seleccionado === d.id
          const comun = {
            d: d.d,
            fillRule: "evenodd" as const,
            onMouseEnter: () => setEnfocado(d.id),
            onMouseLeave: () => setEnfocado(null),
          }
          if (!activo) {
            return (
              <path
                key={d.id}
                {...comun}
                data-departamento={d.id}
                aria-hidden="true"
                className="fill-slate-200 stroke-card stroke-[0.6] dark:fill-slate-700"
              />
            )
          }
          return (
            <path
              key={d.id}
              {...comun}
              data-departamento={d.id}
              role="button"
              tabIndex={0}
              aria-pressed={elegido}
              aria-label={`${d.nombre}: ${unidades(n)}`}
              onFocus={() => setEnfocado(d.id)}
              onBlur={() => setEnfocado(null)}
              onClick={() => onSeleccionar(elegido ? null : d.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onSeleccionar(elegido ? null : d.id)
                }
              }}
              className={`cursor-pointer stroke-card stroke-[0.6] transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:stroke-ring focus-visible:stroke-[1.6] ${
                elegido ? "fill-accent" : "fill-primary hover:fill-accent"
              }`}
            />
          )
        })}
      </svg>
      <figcaption className="mt-3 space-y-2 text-center">
        <p className="min-h-6 text-sm font-medium" data-testid="etiqueta-mapa">{etiqueta}</p>
        <p className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" aria-hidden="true" />Con unidades activas
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-200 dark:bg-slate-700" aria-hidden="true" />Sin unidades
          </span>
        </p>
      </figcaption>
    </figure>
  )
}
