import { ArrowRight, PackageSearch } from "lucide-react"
import { useCatalogoPublico } from "../hooks/useCatalogoPublico"
import { visualCategoria } from "../lib/visualCategoria"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { EstadoVacio } from "@/components/ui/EstadoVacio"
import { cn } from "@/lib/utils/utils"

export function CatalogoReferencia() {
  const query = useCatalogoPublico()
  const productos = query.data ?? []
  return (
    <section aria-labelledby="catalogo-titulo" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-accent">Catálogo de referencia</p>
          <h2 id="catalogo-titulo" className="mt-2 text-3xl font-bold tracking-tight">Lo que podemos ayudarte a conseguir.</h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          Una muestra de nuestras categorías. Solicita una cotización para validar disponibilidad y tiempos.
        </p>
      </div>

      {query.isPending ? (
        <CargandoSpinner texto="Cargando catálogo..." />
      ) : query.isError ? (
        <div className="mt-8">
          <ErrorBanner message="No pudimos cargar el catálogo. Puedes solicitar una cotización directamente." onRetry={() => query.refetch()} />
        </div>
      ) : productos.length === 0 ? (
        <EstadoVacio
          icono={<PackageSearch className="h-5 w-5" />}
          titulo="Catálogo en actualización"
          descripcion="Nuestro equipo puede ayudarte a encontrar lo que necesitas."
        />
      ) : (
        <>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {productos.slice(0, 8).map((producto) => {
              const { Icono, tono } = visualCategoria(producto.categoria, producto.nombre)
              return (
                <article
                  key={producto.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:border-accent/40 hover:shadow-md motion-safe:hover:-translate-y-0.5"
                >
                  <div className={cn("relative flex h-32 items-center justify-center overflow-hidden", tono)}>
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 opacity-20 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:14px_14px]"
                    />
                    <div aria-hidden="true" className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-current opacity-10" />
                    <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-sm motion-safe:transition-transform motion-safe:group-hover:scale-110">
                      <Icono className="h-8 w-8" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">
                      {producto.categoria ?? "Operación minera"}
                    </p>
                    <h3 className="mt-1 line-clamp-2 font-semibold leading-snug">{producto.nombre}</h3>
                    {producto.descripcion && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{producto.descripcion}</p>
                    )}
                    <a
                      href="#solicitud"
                      className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-accent hover:underline"
                    >
                      Pedir cotización
                      <ArrowRight className="h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
          <p className="mt-10 text-center text-sm text-muted-foreground">
            ¿No lo ves?{" "}
            <a href="#solicitud" className="font-semibold text-accent hover:underline">Pídelo aquí</a>
          </p>
        </>
      )}
    </section>
  )
}