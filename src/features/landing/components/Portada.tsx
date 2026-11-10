import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"

export function Portada() {
  return (
    <section className="border-b border-border bg-muted/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.15fr_.85fr] md:items-center md:py-24 lg:px-8">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Logística que mueve operaciones</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Repuestos y servicios confiables para la minería.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">Centralizamos tu abastecimiento para que cada operación avance con rapidez, trazabilidad y respaldo técnico.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/portal/solicitud" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Solicitar cotización <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/portal/registro" className="inline-flex items-center justify-center rounded-md border border-border bg-card px-5 py-3 font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Ingresar</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {["Atención especializada", "Cobertura minera", "Seguimiento de pedidos"].map((item) => <span key={item} className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" />{item}</span>)}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold text-accent">Tu operación, nuestro compromiso</p>
          <p className="mt-3 text-2xl font-semibold">Abastecimiento simple, respuesta rápida.</p>
          <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted p-4"><strong className="block text-2xl text-foreground">360°</strong><span className="text-muted-foreground">acompañamiento</span></div>
            <div className="rounded-lg bg-muted p-4"><strong className="block text-2xl text-foreground">24/7</strong><span className="text-muted-foreground">trazabilidad</span></div>
          </div>
        </div>
      </div>
    </section>
  )
}
