import { MapPin } from "lucide-react"
import { useCobertura } from "../hooks/useCobertura"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { ErrorBanner } from "@/components/ui/ErrorBanner"

export function CoberturaMinera() {
  const query = useCobertura()
  const cobertura = query.data ?? []

  return (
    <section aria-labelledby="cobertura-titulo" className="bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Cobertura minera</p>
            <h2 id="cobertura-titulo" className="mt-2 text-3xl font-bold tracking-tight">Llegamos donde tu operación lo necesita.</h2>
          </div>
          {/* Dato real: las unidades mineras activas que devuelve /api/public/cobertura. */}
          {cobertura.length > 0 && (
            <p className="rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
              <strong className="text-foreground">{cobertura.length}</strong>{" "}
              {cobertura.length === 1 ? "unidad minera atendida" : "unidades mineras atendidas"}
            </p>
          )}
        </div>

        {query.isPending ? (
          <CargandoSpinner texto="Cargando cobertura..." />
        ) : query.isError ? (
          <div className="mt-8">
            <ErrorBanner message="La cobertura se actualizará pronto. Contáctanos para confirmar atención en tu zona." onRetry={() => query.refetch()} />
          </div>
        ) : cobertura.length === 0 ? (
          <p className="mt-6 text-muted-foreground">Contáctanos para conocer nuestra cobertura actual.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cobertura.map((zona) => (
              <article key={zona.id} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-accent/40">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  {zona.region && (
                    <p className="text-xs font-semibold uppercase tracking-wide text-accent">{zona.region}</p>
                  )}
                  <h3 className="mt-1 font-semibold leading-snug">{zona.nombre}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{zona.descripcion ?? "Atención coordinada con nuestro equipo."}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
