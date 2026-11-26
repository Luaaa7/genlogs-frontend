import { useState } from "react"
import { CheckCircle2, Clock, Minus, Plus } from "lucide-react"
import type { RepuestoPublico } from "@/api/publicApi"
import { visualCategoria } from "../lib/visualCategoria"
import { cn } from "@/lib/utils/utils"
import { imagenCloudinary } from "@/lib/imagenCloudinary"
import { textoPlazoRepuesto } from "../lib/plazoRepuesto"

const TIPO: Record<RepuestoPublico["tipoRepuesto"], string> = {
  OEM: "Original (OEM)",
  ALTERNATIVO: "Alternativo compatible",
}

interface Props {
  repuesto: RepuestoPublico
  /** Unidades de este repuesto que ya están en el carrito de cotización (0 si no está). */
  enCotizacion: number
  onAgregar: () => void
  onSumar: () => void
  onRestar: () => void
}

/**
 * Tarjeta de la vitrina pública: sin precio (RF-82). Solo fotos propias; si no hay,
 * o si la foto falla al cargar (IC10, BPMN v3.4 de Mell), la ilustración de su categoría.
 */
export function TarjetaRepuesto({ repuesto: r, enCotizacion, onAgregar, onSumar, onRestar }: Props) {
  const { Icono, tono } = visualCategoria(r.categoria, r.nombre)
  // Se guarda la URL que falló: si el repuesto cambia de foto, se vuelve a intentar.
  const [urlFallida, setUrlFallida] = useState<string | null>(null)
  const foto = r.urlImagen && r.urlImagen !== urlFallida ? r.urlImagen : null
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:border-accent/40 hover:shadow-md motion-safe:hover:-translate-y-0.5">
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        {foto ? (
          <img
            src={imagenCloudinary(foto, 480)}
            alt={r.nombre}
            loading="lazy"
            onError={() => setUrlFallida(foto)}
            className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105"
          />
        ) : (
          <div className={cn("relative flex h-full flex-col items-center justify-center gap-2", tono)}>
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-20 bg-[radial-gradient(currentColor_1px,transparent_1px)] bg-size-[14px_14px]"
            />
            <div aria-hidden="true" className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-current opacity-10" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-sm motion-safe:transition-transform motion-safe:group-hover:scale-110">
              <Icono className="h-8 w-8" aria-hidden="true" />
            </span>
            <span className="relative text-xs text-muted-foreground">Foto referencial próximamente</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-0.5 text-xs font-medium text-foreground shadow-sm backdrop-blur">
          {TIPO[r.tipoRepuesto]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">{r.categoria}</p>
        <h3 className="mt-1 line-clamp-2 font-semibold leading-snug">{r.nombre}</h3>
        <dl className="mt-2 space-y-1 text-sm text-muted-foreground">
          {r.marca && <div><dt className="sr-only">Marca</dt><dd>{r.marca}</dd></div>}
          {r.numeroParte && (
            <div className="flex items-center gap-1.5">
              <dt>N.º de parte:</dt>
              <dd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{r.numeroParte}</dd>
            </div>
          )}
        </dl>
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 text-accent" aria-hidden="true" />
          {textoPlazoRepuesto(r.plazoEntrega)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Disponible a pedido · sujeto a confirmación</p>

        <div className="mt-auto pt-4">
          {enCotizacion > 0 ? (
            <div className="flex items-center justify-between gap-2">
              <p role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                En cotización ({enCotizacion})
              </p>
              <div className="inline-flex items-center overflow-hidden rounded-md border border-border">
                <button
                  type="button"
                  onClick={onRestar}
                  aria-label={`Disminuir cantidad de ${r.nombre}`}
                  className="p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={onSumar}
                  aria-label={`Aumentar cantidad de ${r.nombre}`}
                  className="border-l border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAgregar}
              aria-label={`Cotizar ${r.nombre}`}
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              Cotizar
            </button>
          )}
        </div>
      </div>
    </article>
  )
}