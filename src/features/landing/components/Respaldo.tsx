import { BadgeCheck, Mountain, ShieldCheck } from "lucide-react"

const puntos = [
  { icono: ShieldCheck, titulo: "Proveedores evaluados", texto: "Trabajamos con proveedores que revisamos antes de cotizar." },
  { icono: BadgeCheck, titulo: "Certificaciones y calidad", texto: "Cuidamos la documentación y la calidad de cada repuesto." },
  { icono: Mountain, titulo: "Clientes del sector minero", texto: "Conocemos las exigencias de una operación minera." },
]

export function Respaldo() {
  return (
    <section aria-labelledby="respaldo-titulo" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Respaldo</p>
        <h2 id="respaldo-titulo" className="mt-2 text-3xl font-bold tracking-tight">Relaciones construidas para durar.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Acompañamos a equipos que necesitan consistencia, cumplimiento y una respuesta que no se detiene.
        </p>
        <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
          {puntos.map(({ icono: Icono, titulo, texto }) => (
            <article key={titulo} className="rounded-xl border border-border bg-muted/40 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Icono className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold">{titulo}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{texto}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
