import { useState } from "react"
import { MapPin } from "lucide-react"
import { useCobertura } from "../hooks/useCobertura"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { ErrorBanner } from "@/components/ui/ErrorBanner"

/** Unidades mineras que se muestran al inicio; el resto se despliega con el botón (v3.4). */
export const UNIDADES_INICIALES = 6

export function CoberturaMinera() {
  const query = useCobertura()
  const cobertura = query.data ?? []
  const [verTodas, setVerTodas] = useState(false)
  const hayMas = cobertura.length > UNIDADES_INICIALES
  const visibles = verTodas ? cobertura : cobertura.slice(0, UNIDADES_INICIALES)

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
            <div id="cobertura-unidades" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibles.map((zona) => (
                <article key={zona.id} className="rounded-xl border border-border bg-card p-5">
                  <MapPin className="h-6 w-6 text-accent" />
                  <h3 className="mt-4 font-semibold">{zona.nombre}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{zona.region ?? zona.descripcion ?? "Atención coordinada con nuestro equipo."}</p>
                </article>
              ))}
            </div>
            {hayMas && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  aria-expanded={verTodas}
                  aria-controls="cobertura-unidades"
                  onClick={() => setVerTodas((v) => !v)}
                  className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-foreground"
                >
                  {verTodas ? "Ver menos" : "Ver todas las unidades mineras"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
