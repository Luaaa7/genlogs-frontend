import { useState } from "react"
import { MapPin, Search } from "lucide-react"
import { useCobertura } from "../hooks/useCobertura"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { ErrorBanner } from "@/components/ui/ErrorBanner"

/** Unidades mineras que se muestran al inicio; el resto se despliega con el botón (v3.4). */
export const UNIDADES_INICIALES = 6

/** Minúsculas y sin tildes: «Junín» se encuentra al escribir «junin». */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

/**
 * Cobertura minera. Al inicio, las 6 unidades destacadas. Al desplegar todas, un buscador
 * (por nombre de unidad o por departamento) y una lista compacta en un contenedor de altura
 * controlada con scroll interno, para que la landing no se estire y las secciones de abajo no se empujen.
 */
export function CoberturaMinera() {
  const query = useCobertura()
  const cobertura = query.data ?? []
  const [verTodas, setVerTodas] = useState(false)
  const hayMas = cobertura.length > UNIDADES_INICIALES
  const [busqueda, setBusqueda] = useState("")
  const destacadas = cobertura.slice(0, UNIDADES_INICIALES)
  const termino = normalizar(busqueda)
  const filtradas = termino
    ? cobertura.filter((zona) => normalizar(`${zona.nombre} ${zona.region ?? ""}`).includes(termino))
    : cobertura

  function alternar() {
    // Al plegar, la búsqueda se limpia para que la próxima vez se abra con todo.
    if (verTodas) setBusqueda("")
    setVerTodas((v) => !v)
  }

  return (
    <section aria-labelledby="cobertura-titulo" className="bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Cobertura minera</p>
        <h2 id="cobertura-titulo" className="mt-2 text-3xl font-bold">Llegamos donde tu operación lo necesita.</h2>
        {query.isPending ? (
          <CargandoSpinner texto="Cargando cobertura..." />
        ) : query.isError ? (
          <div className="mt-8">
            <ErrorBanner message="La cobertura se actualizará pronto. Contáctanos para confirmar atención en tu zona." onRetry={() => query.refetch()} />
          </div>
        ) : cobertura.length === 0 ? (
          <p className="mt-6 text-muted-foreground">Contáctanos para conocer nuestra cobertura actual.</p>
        ) : (
          <>
            {verTodas ? (
              <div id="cobertura-unidades" className="mt-8 space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input
                    type="search"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar unidad minera o región..."
                    aria-label="Buscar unidad minera o región"
                    autoComplete="off"
                    className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <p role="status" className="text-sm text-muted-foreground">
                  {filtradas.length === 0
                    ? "No encontramos unidades con ese nombre o región. Contáctanos para confirmar atención en tu zona."
                    : `${filtradas.length} de ${cobertura.length} unidades`}
                </p>
                {filtradas.length > 0 && (
                  <div
                    role="region"
                    aria-label="Todas las unidades mineras"
                    tabIndex={0}
                    className="max-h-96 overflow-y-auto scroll-smooth pr-1 motion-reduce:scroll-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {filtradas.map((zona) => (
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
              </div>
            ) : (
              <div id="cobertura-unidades" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {destacadas.map((zona) => (
                  <article key={zona.id} className="rounded-xl border border-border bg-card p-5">
                    <MapPin className="h-6 w-6 text-accent" />
                    <h3 className="mt-4 font-semibold">{zona.nombre}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{zona.region ?? zona.descripcion ?? "Atención coordinada con nuestro equipo."}</p>
                  </article>
                ))}
              </div>
            )}
            {hayMas && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  aria-expanded={verTodas}
                  aria-controls="cobertura-unidades"
                  onClick={alternar}
                  className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-foreground"
                >
                  {verTodas ? "Mostrar menos" : `Ver todas las unidades mineras (${cobertura.length})`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
