import { formatCurrency } from "@/lib/formatters/currency"
import { DashboardCard } from "./DashboardCard"

interface TasaAprobacionCardProps {
  /** Aprobadas sobre respondidas, 0–100; null si aún no hay respuestas. */
  tasa: number | null
  totalEmitidas: number
  montoCotizado: number
  vencenSemana: number
  facturasVencidas: number
}

const R = 54
const CIRC = 2 * Math.PI * R

/** Anillo de aprobación (con marcas) y dos medidores de urgencia. */
export function TasaAprobacionCard({ tasa, totalEmitidas, montoCotizado, vencenSemana, facturasVencidas }: TasaAprobacionCardProps) {
  return (
    <DashboardCard id="dash-aprobacion" titulo="Tasa de aprobación" extra={<span className="text-xs text-muted-foreground">Cotizaciones respondidas</span>}>
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative h-35 w-35 shrink-0">
          <svg viewBox="0 0 140 140" className="h-full w-full" aria-hidden="true">
            <circle cx="70" cy="70" r={R} fill="none" stroke="var(--muted)" strokeWidth={14} />
            <circle
              cx="70" cy="70" r={R} fill="none" stroke="var(--viz-1)" strokeWidth={14}
              transform="rotate(-90 70 70)"
              strokeDasharray={`${((tasa ?? 0) / 100) * CIRC} ${CIRC}`}
            />
            {/* Marcas: cortes del color de la tarjeta sobre el anillo */}
            <circle cx="70" cy="70" r={R} fill="none" stroke="var(--card)" strokeWidth={16} strokeDasharray="1.6 4.4" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums">
            {tasa === null ? "—" : `${tasa}%`}
          </span>
        </div>
        <div className="min-w-32 flex-1">
          <p className="text-3xl font-bold tracking-tight tabular-nums">{totalEmitidas}</p>
          <p className="text-[13px] text-muted-foreground">cotizaciones registradas</p>
          <p className="mt-2.5 text-[13px] text-muted-foreground">
            <strong className="font-semibold tabular-nums text-foreground">{formatCurrency(montoCotizado)}</strong> cotizado
          </p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Medidor valor={vencenSemana} etiqueta="Cotizaciones vencen esta semana" color="var(--viz-3)" />
        <Medidor valor={facturasVencidas} etiqueta="Facturas con cobro vencido" color="var(--viz-2)" />
      </div>
    </DashboardCard>
  )
}

function Medidor({ valor, etiqueta, color }: { valor: number; etiqueta: string; color: string }) {
  const r = 58
  const c = 2 * Math.PI * r
  // El arco crece con el valor hasta 10 (más es "lleno"): solo da una idea de magnitud.
  const proporcion = Math.min(valor, 10) / 10
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-14 w-14 shrink-0">
        <svg viewBox="0 0 140 140" className="h-full w-full" aria-hidden="true">
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--muted)" strokeWidth={16} />
          <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth={16} strokeLinecap="round" transform="rotate(-90 70 70)" strokeDasharray={`${proporcion * c} ${c}`} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold tabular-nums">{valor}</span>
      </div>
      <span className="text-[13px] leading-tight text-muted-foreground">{etiqueta}</span>
    </div>
  )
}
