import { MapPin } from "lucide-react"
import { useCobertura } from "../hooks/useCobertura"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { ErrorBanner } from "@/components/ui/ErrorBanner"

export function CoberturaMinera() {
  const query = useCobertura()
  const cobertura = query.data ?? []
  return <section aria-labelledby="cobertura-titulo" className="bg-muted/40"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><p className="text-sm font-semibold uppercase tracking-wide text-accent">Cobertura minera</p><h2 id="cobertura-titulo" className="mt-2 text-3xl font-bold">Llegamos donde tu operación lo necesita.</h2>{query.isPending ? <CargandoSpinner texto="Cargando cobertura..." /> : query.isError ? <div className="mt-8"><ErrorBanner message="La cobertura se actualizará pronto. Contáctanos para confirmar atención en tu zona." onRetry={() => query.refetch()} /></div> : cobertura.length === 0 ? <p className="mt-6 text-muted-foreground">Contáctanos para conocer nuestra cobertura actual.</p> : <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cobertura.map((zona) => <article key={zona.id} className="rounded-xl border border-border bg-card p-5"><MapPin className="h-6 w-6 text-accent" /><h3 className="mt-4 font-semibold">{zona.nombre}</h3><p className="mt-1 text-sm text-muted-foreground">{zona.region ?? zona.descripcion ?? "Atención coordinada con nuestro equipo."}</p></article>)}</div>}</div></section>
}
