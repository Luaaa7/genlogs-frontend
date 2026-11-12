import { CheckCircle2, Clock, Loader2, Package } from "lucide-react"
import type { RepuestoPublico } from "@/api/publicApi"

const TIPO: Record<RepuestoPublico["tipoRepuesto"], string> = {
  OEM: "Original (OEM)",
  ALTERNATIVO: "Alternativo compatible",
}

interface Props {
  repuesto: RepuestoPublico
  cotizando: boolean
  cotizado: boolean
  onCotizar: () => void
}

/** Tarjeta de la vitrina pública: sin precio (RF-82). Solo fotos propias; si no hay, ícono de la categoría. */
export function TarjetaRepuesto({ repuesto: r, cotizando, cotizado, onCotizar }: Props) {
  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-4">
      <div className="flex h-36 items-center justify-center overflow-hidden rounded-lg bg-muted">
        {r.urlImagen ? (
          <img src={r.urlImagen} alt={r.nombre} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <Package className="h-9 w-9 text-accent" aria-hidden="true" />
            <span className="text-xs">Foto referencial próximamente</span>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-accent">{r.categoria}</p>
      <h3 className="mt-1 font-semibold leading-snug">{r.nombre}</h3>
      <dl className="mt-2 space-y-0.5 text-sm text-muted-foreground">
        {r.marca && <div><dt className="sr-only">Marca</dt><dd>{r.marca}</dd></div>}
        {r.numeroParte && <div><dt className="inline">N.º de parte: </dt><dd className="inline font-mono text-xs">{r.numeroParte}</dd></div>}
      </dl>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-border px-2 py-0.5">{TIPO[r.tipoRepuesto]}</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {r.plazoEntrega}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Disponible a pedido · sujeto a confirmación</p>
      <div className="mt-auto pt-4">
        {cotizado ? (
          <p role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Pedido enviado
          </p>
        ) : (
          <button
            type="button"
            onClick={onCotizar}
            disabled={cotizando}
            aria-label={`Cotizar ${r.nombre}`}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {cotizando && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
            Cotizar
          </button>
        )}
      </div>
    </article>
  )
}
