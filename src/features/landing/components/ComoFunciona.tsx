import { FileCheck2, MessageSquareText, Truck } from "lucide-react"

const pasos = [
  { icono: MessageSquareText, titulo: "Cuéntanos qué necesitas", texto: "Describe materiales, cantidades y fechas; nosotros ordenamos la información." },
  { icono: FileCheck2, titulo: "Recibe una propuesta clara", texto: "Evaluamos alternativas y te presentamos opciones con tiempos y condiciones." },
  { icono: Truck, titulo: "Coordina y sigue el pedido", texto: "Mantén el control con comunicación directa y seguimiento de cada avance." },
]

export function ComoFunciona() {
  return (
    <section aria-labelledby="como-titulo" className="bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Paso a paso</p>
        <h2 id="como-titulo" className="mt-2 text-3xl font-bold tracking-tight">Cómo funciona</h2>
        <ol className="relative mt-10 grid gap-6 md:grid-cols-3">
          {/* Línea que une los pasos en pantalla grande */}
          <span aria-hidden="true" className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-border md:block" />
          {pasos.map(({ icono: Icono, titulo, texto }, index) => (
            <li key={titulo} className="relative rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icono className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-5 font-semibold">{titulo}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
