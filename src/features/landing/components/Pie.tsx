import { ArrowRight } from "lucide-react"

export function Pie() {
  return (
    <section aria-labelledby="pie-titulo" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-muted/40 px-6 py-12 text-center sm:px-12">
        <div>
          <h2 id="pie-titulo" className="text-2xl font-bold tracking-tight">¿Listo para simplificar tu abastecimiento?</h2>
          <p className="mt-2 text-muted-foreground">Conversemos sobre tu próxima necesidad.</p>
        </div>
        <a
          href="#solicitud"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Pedir cotización <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  )
}
