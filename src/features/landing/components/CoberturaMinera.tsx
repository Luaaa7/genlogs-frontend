import { useState } from "react"
import { MapPin, Search, X } from "lucide-react"
import { useCobertura } from "../hooks/useCobertura"
import { EsqueletoCobertura } from "./EsqueletosPublicos"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { departamentoDe, nombreDepartamento, normalizarTexto } from "../lib/departamentosCobertura"
import { MapaPeru } from "./MapaPeru"

/** Unidades mineras que se muestran al inicio; el resto se despliega con el botón (v3.4). */
export const UNIDADES_INICIALES = 6

/**
 * Cobertura minera. A la izquierda, el mapa del Perú con los departamentos que tienen unidades
 * mineras; a la derecha, el buscador y la lista. Al inicio se ven las 6 destacadas. Elegir un
 * departamento en el mapa o escribir en el buscador filtra la lista, y «Mostrar menos» limpia todo.
 * La lista vive en un contenedor de altura fija con scroll interno para no estirar la landing.
 */
export function CoberturaMinera() {
  const query = useCobertura()
  const cobertura = query.data ?? []
  const [verTodas, setVerTodas] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [departamento, setDepartamento] = useState<string | null>(null)
  const hayMas = cobertura.length > UNIDADES_INICIALES

  const conteos: Record<string, number> = {}
  for (const zona of cobertura) {
    const id = departamentoDe(zona.region)
    if (id) conteos[id] = (conteos[id] ?? 0) + 1
  }

  const termino = normalizarTexto(busqueda)
  const visibles = departamento
    ? cobertura.filter((zona) => departamentoDe(zona.region) === departamento)
    : termino
      ? cobertura.filter((zona) => normalizarTexto(`${zona.nombre} ${zona.region ?? ""}`).includes(termino))
      : verTodas
        ? cobertura
        : cobertura.slice(0, UNIDADES_INICIALES)
  const expandida = verTodas || departamento !== null || termino !== ""

  /** Buscar por texto y elegir un departamento no se mezclan: el que se usa último limpia al otro. */
  function escribir(valor: string) {
    setBusqueda(valor)
    setDepartamento(null)
  }

  function elegirDepartamento(id: string | null) {
    setDepartamento(id)
    if (id) setBusqueda("")
  }

  function alternar() {
    if (expandida) {
      setVerTodas(false)
      setBusqueda("")
      setDepartamento(null)
      return
    }
    setVerTodas(true)
  }

  return (
    <section aria-labelledby="cobertura-titulo" className="bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Cobertura minera</p>
        <h2 id="cobertura-titulo" className="mt-2 text-3xl font-bold">Llegamos donde tu operación lo necesita.</h2>
        {query.isPending ? (
          <EsqueletoCobertura cantidad={UNIDADES_INICIALES} />
        ) : query.isError ? (
          <div className="mt-8">
            <ErrorBanner message="La cobertura se actualizará pronto. Contáctanos para confirmar atención en tu zona." onRetry={() => query.refetch()} />
          </div>
        ) : cobertura.length === 0 ? (
          <p className="mt-6 text-muted-foreground">Contáctanos para conocer nuestra cobertura actual.</p>
        ) : (
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
            <MapaPeru conteos={conteos} seleccionado={departamento} onSeleccionar={elegirDepartamento} />

            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  type="search"
                  value={busqueda}
                  onChange={(e) => escribir(e.target.value)}
                  placeholder="Buscar unidad minera o región..."
                  aria-label="Buscar unidad minera o región"
                  autoComplete="off"
                  className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {departamento && (
                <button
                  type="button"
                  onClick={() => setDepartamento(null)}
                  aria-label={`Región: ${nombreDepartamento(departamento)}, quitar filtro`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                >
                  Región: {nombreDepartamento(departamento)}
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}

              <p role="status" className="text-sm text-muted-foreground">
                {visibles.length === 0
                  ? "No encontramos unidades con ese nombre o región. Contáctanos para confirmar atención en tu zona."
                  : `${visibles.length} de ${cobertura.length} unidades`}
              </p>

              {visibles.length > 0 && (
                <div
                  id="cobertura-unidades"
                  role="region"
                  aria-label="Unidades mineras"
                  tabIndex={0}
                  className="max-h-96 overflow-y-auto scroll-smooth pr-1 motion-reduce:scroll-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    {visibles.map((zona) => (
                      <article key={zona.id} className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold leading-snug">{zona.nombre}</h3>
                          <p className="text-xs text-muted-foreground">{zona.region ?? zona.descripcion ?? "Atención coordinada con nuestro equipo."}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {hayMas && (
                <div className="pt-1">
                  <button
                    type="button"
                    aria-expanded={expandida}
                    aria-controls="cobertura-unidades"
                    onClick={alternar}
                    className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-foreground"
                  >
                    {expandida ? "Mostrar menos" : `Ver todas las unidades mineras (${cobertura.length})`}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
