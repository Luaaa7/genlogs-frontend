import { cn } from "@/lib/utils/utils"

export interface OpcionChip<T extends string> {
  /** undefined = "todas" (sin filtro). */
  valor?: T
  label: string
  /** Conteo opcional junto a la etiqueta. */
  n?: number
}

interface FiltroChipsProps<T extends string> {
  opciones: OpcionChip<T>[]
  valor?: T
  onChange: (valor?: T) => void
  etiqueta: string
}

/** Filtro de una sola opción en botones tipo píldora (estados, tipos…). */
export function FiltroChips<T extends string>({ opciones, valor, onChange, etiqueta }: FiltroChipsProps<T>) {
  return (
    <div role="group" aria-label={etiqueta} className="flex flex-wrap gap-2">
      {opciones.map((o) => {
        const activa = o.valor === valor
        return (
          <button
            key={o.label}
            type="button"
            aria-pressed={activa}
            onClick={() => onChange(o.valor)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activa ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"
            )}
          >
            {o.label}
            {o.n !== undefined && (
              <span className={cn("tabular-nums", activa ? "text-primary-foreground/80" : "text-muted-foreground")}>{o.n}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
