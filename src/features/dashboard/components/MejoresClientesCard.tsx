import { Link } from "react-router-dom"
import { formatCurrency } from "@/lib/formatters/currency"
import { iniciales, type ClienteDestacado } from "../lib/calculos"

// Franja superior de cada tarjeta: decorativa, en los tres colores de la paleta.
const FRANJAS = ["bg-brand-navy", "bg-brand-blue", "bg-viz-3"]

/** Los 3 clientes con más facturación del año. */
export function MejoresClientesCard({ clientes }: { clientes: ClienteDestacado[] }) {
  return (
    <section aria-labelledby="dash-mejores">
      <h2 id="dash-mejores" className="mb-3 text-[15px] font-semibold">Mejores clientes del año</h2>
      {clientes.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
          Aparecerán cuando haya facturas emitidas este año.
        </p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
          {clientes.map((c, i) => (
            <li key={c.nombre}>
              <Link
                to="/clientes"
                className="flex h-full flex-col items-center gap-1.5 overflow-hidden rounded-xl border border-border bg-card px-4 pb-4 text-center transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className={`-mx-4 h-10 self-stretch ${FRANJAS[i % FRANJAS.length]}`} aria-hidden="true" />
                <span className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full border-3 border-card bg-muted text-[15px] font-semibold text-foreground" aria-hidden="true">
                  {iniciales(c.nombre)}
                </span>
                <span className="text-[13px] font-semibold leading-snug text-foreground">{c.nombre}</span>
                <span className="text-[15px] font-bold tabular-nums text-foreground">{formatCurrency(c.facturado)}</span>
                <span className="text-xs text-muted-foreground">{c.comprobantes} {c.comprobantes === 1 ? "comprobante" : "comprobantes"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
