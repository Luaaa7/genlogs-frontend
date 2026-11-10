import { PackageSearch } from "lucide-react"
import { useCatalogoPublico } from "../hooks/useCatalogoPublico"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { EstadoVacio } from "@/components/ui/EstadoVacio"

export function CatalogoReferencia() {
  const query = useCatalogoPublico()
  const productos = query.data ?? []
  return <section aria-labelledby="catalogo-titulo" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wide text-accent">Catálogo de referencia</p><h2 id="catalogo-titulo" className="mt-2 text-3xl font-bold">Lo que podemos ayudarte a conseguir.</h2></div><p className="max-w-md text-sm text-muted-foreground">Una muestra de nuestras categorías. Solicita una cotización para validar disponibilidad y tiempos.</p></div>{query.isPending ? <CargandoSpinner texto="Cargando catálogo..." /> : query.isError ? <div className="mt-8"><ErrorBanner message="No pudimos cargar el catálogo. Puedes solicitar una cotización directamente." onRetry={() => query.refetch()} /></div> : productos.length === 0 ? <EstadoVacio icono={<PackageSearch className="h-5 w-5" />} titulo="Catálogo en actualización" descripcion="Nuestro equipo puede ayudarte a encontrar lo que necesitas." /> : <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{productos.slice(0, 8).map((producto) => <article key={producto.id} className="rounded-xl border border-border bg-card p-5"><div className="flex h-28 items-center justify-center rounded-lg bg-muted text-accent"><PackageSearch className="h-9 w-9" aria-hidden="true" /></div><h3 className="mt-4 font-semibold">{producto.nombre}</h3><p className="mt-1 text-sm text-muted-foreground">{producto.categoria ?? producto.descripcion ?? "Solución para operación minera"}</p></article>)}</div>}</section>
}
