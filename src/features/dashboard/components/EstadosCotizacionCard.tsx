import { Link } from "react-router-dom"
import type { CotizacionEstadoItem } from "@/types/dashboard.types"
import { ETIQUETA_ESTADO } from "../lib/calculos"
import { DashboardCard, SinDatos } from "./DashboardCard"

/** Cuántas cotizaciones hay en cada estado (barras horizontales). */
export function EstadosCotizacionCard({ estados }: { estados: CotizacionEstadoItem[] }) {
  const filas = [...estados].filter((e) => e.cantidad > 0).sort((a, b) => b.cantidad - a.cantidad)
  const maximo = Math.max(1, ...filas.map((e) => e.cantidad))

  return (
    <DashboardCard
      id="dash-estados"
      titulo="Cotizaciones por estado"
      extra={<Link to="/cotizaciones" className="rounded text-[13px] font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Ver todas</Link>}
    >
      {filas.length === 0 ? (
        <SinDatos>Sin cotizaciones registradas.</SinDatos>
      ) : (
        <ul className="flex flex-col gap-3">
          {filas.map((e) => (
            <li key={e.estado} className="grid grid-cols-[112px_minmax(0,1fr)_28px] items-center gap-2.5 text-[13px]">
              <span className="truncate">{ETIQUETA_ESTADO[e.estado] ?? e.estado}</span>
              <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <span className="block h-full rounded-full bg-viz-2" style={{ width: `${(e.cantidad / maximo) * 100}%` }} />
              </span>
              <span className="text-right font-semibold tabular-nums">{e.cantidad}</span>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}
