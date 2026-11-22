import { ArrowRight, CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"
import { IlustracionPortada } from "./IlustracionPortada"
import { CIFRAS, cifrasConValor, type Cifra } from "../lib/cifras"

const VENTAJAS = ["Atención especializada", "Cobertura minera", "Seguimiento de pedidos"]

/** Portada (v3.4, K1): ilustración de Mell y solo las cifras comprobadas. */
export function Portada({ cifras = CIFRAS }: { cifras?: Cifra[] }) {
  const visibles = cifrasConValor(cifras)

  return (
    <section className="border-b border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.15fr_.85fr] md:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-accent">Logística que mueve operaciones</p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Repuestos y servicios confiables para la minería.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Centralizamos tu abastecimiento para que cada operación avance con rapidez, trazabilidad y respaldo técnico.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#solicitud"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Solicitar cotización <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <Link
                to="/portal/ingreso"
                className="inline-flex items-center justify-center rounded-md border border-border bg-card px-5 py-3 font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Ingresar
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              {VENTAJAS.map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <IlustracionPortada className="h-auto w-full drop-shadow-sm" />
        </div>

        {visibles.length > 0 && (
          <div className="mt-14 border-t border-border pt-10">
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {visibles.map((c) => (
                <div key={c.id} className="flex flex-col-reverse gap-1 rounded-xl border border-border bg-card p-5 shadow-sm">
                  <dt className="text-sm text-muted-foreground">{c.etiqueta}</dt>
                  <dd className="text-3xl font-bold tracking-tight text-foreground">{c.valor}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">Cifras al {visibles[0].fecha}.</p>
          </div>
        )}
      </div>
    </section>
  )
}
