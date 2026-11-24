import { ClipboardCheck, Headphones, ShieldCheck } from "lucide-react"

const beneficios = [
  { icono: ShieldCheck, titulo: "Calidad que respalda", texto: "Trabajamos con proveedores evaluados y referencias técnicas para reducir riesgos." },
  { icono: Headphones, titulo: "Acompañamiento experto", texto: "Nuestro equipo entiende la urgencia de campo y responde con criterio técnico." },
  { icono: ClipboardCheck, titulo: "Trazabilidad simple", texto: "Consulta solicitudes y pedidos desde un solo lugar, con información clara." },
]

export function PorQue() {
  return (
    <section aria-labelledby="por-que-titulo" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Por qué GenLogs</p>
        <h2 id="por-que-titulo" className="mt-2 text-3xl font-bold tracking-tight">Menos fricción para abastecer mejor.</h2>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {beneficios.map(({ icono: Icon, titulo, texto }) => (
          <article
            key={titulo}
            className="group rounded-xl border border-border bg-card p-6 shadow-sm transition hover:border-accent/40 hover:shadow-md motion-safe:hover:-translate-y-0.5"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent motion-safe:transition-transform motion-safe:group-hover:scale-110">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-semibold">{titulo}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{texto}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
