import { ArrowRight, Check } from "lucide-react"
import { Link } from "react-router-dom"
import { LineasTopograficas } from "@/features/acceso-cliente/components/LineasTopograficas"
import { useCategoriasVitrina } from "../hooks/useVitrinaPublica"

const ETAPAS_EJEMPLO = ["Recibida", "En búsqueda", "Cotizada", "En camino"]
const ACTUAL = 2

export function Portada() {
  const categorias = useCategoriasVitrina()
  const total = categorias.data?.reduce((suma, c) => suma + c.cantidad, 0) ?? 0
  const datos = [
    ...(total > 0 ? [`${total} repuestos en catálogo`] : []),
    "Precio y plazo confirmados en cada cotización",
    "Sigue tu pedido en el portal",
  ]

  return (
    <section className="relative overflow-hidden border-b border-border bg-muted/40 text-accent/80">
      <LineasTopograficas />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.15fr_.85fr] md:items-center md:py-12 lg:px-8">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Logística que mueve operaciones</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Repuestos y servicios confiables para la minería.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-300">Centralizamos tu abastecimiento para que cada operación avance con rapidez, trazabilidad y respaldo técnico.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/portal/solicitud" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Solicitar cotización <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/portal/registro" className="inline-flex items-center justify-center rounded-md border border-border bg-card px-5 py-3 font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Crear cuenta</Link>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700 dark:text-slate-300">
            {datos.map((item) => <li key={item} className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-green-800 dark:text-green-400" aria-hidden="true" />{item}</li>)}
          </ul>
        </div>
        <VistaPreviaPedido />
      </div>
    </section>
  )
}

/** Tarjeta de ejemplo con datos inventados: muestra cómo se verá un pedido. Solo decorativa. */
function VistaPreviaPedido() {
  return (
    <div data-vista-previa aria-hidden="true" className="mx-auto hidden w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm md:block">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-slate-600 dark:text-slate-400">Así verás tu pedido</p>
          <p className="text-base font-bold">Pedido de ejemplo</p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">En curso</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <span className="block h-full w-[62%] rounded-full bg-accent" />
      </div>
      <ol className="space-y-3">
        {ETAPAS_EJEMPLO.map((titulo, i) => (
          <li key={titulo} aria-current={i === ACTUAL ? "step" : undefined} className="flex items-center gap-3">
            {i < ACTUAL && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-800 text-white"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>}
            {i === ACTUAL && <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent"><span className="h-2 w-2 rounded-full bg-white" /></span>}
            {i > ACTUAL && <span className="h-6 w-6 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
            <span className={i === ACTUAL ? "font-semibold text-accent" : i > ACTUAL ? "text-slate-600 dark:text-slate-400" : "font-medium"}>{titulo}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
