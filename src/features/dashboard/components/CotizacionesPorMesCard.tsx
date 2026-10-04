import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import type { CotizacionesMes } from "../lib/calculos"
import { cn } from "@/lib/utils/utils"
import { DashboardCard, SinDatos } from "./DashboardCard"

const SERIES = [
  { clave: "aprobadas", label: "Aprobadas", color: "var(--viz-1)" },
  { clave: "enCurso", label: "En curso", color: "var(--viz-2)" },
  { clave: "rechazadas", label: "Rechazadas o vencidas", color: "var(--viz-3)" },
] as const

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie"]
const HEAT = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"]

/** Barras apiladas por mes + mapa de calor de cotizaciones creadas por día. */
export function CotizacionesPorMesCard({ porMes, actividad, className }: { porMes: CotizacionesMes[]; actividad: number[][]; className?: string }) {
  const hayDatos = porMes.some((m) => m.aprobadas + m.enCurso + m.rechazadas > 0)
  const maximo = Math.max(1, ...actividad.flat())
  const nivel = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / maximo) * 4)))

  return (
    <DashboardCard id="dash-cot-mes" titulo="Cotizaciones por mes" className={className}>
      {!hayDatos ? (
        <SinDatos>Sin cotizaciones en los últimos meses.</SinDatos>
      ) : (
        <>
          <div className="h-44" role="img" aria-label={porMes.map((m) => `${m.mes}: ${m.aprobadas} aprobadas, ${m.enCurso} en curso, ${m.rechazadas} rechazadas o vencidas`).join("; ")}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porMes} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barSize={32}>
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)", fontSize: 13 }}
                />
                {SERIES.map((s, i) => (
                  <Bar key={s.clave} dataKey={s.clave} name={s.label} stackId="estado" fill={s.color} radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : 0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {SERIES.map((s) => (
              <li key={s.clave} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
                {s.label}
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 className="mt-6 mb-3 text-[13px] font-semibold">Cotizaciones creadas por día</h3>
      <div className="grid grid-cols-[32px_repeat(6,minmax(0,1fr))] gap-1" role="img" aria-label="Mapa de calor de cotizaciones creadas por día hábil en las últimas 6 semanas">
        {actividad.map((fila, d) => (
          <div key={DIAS[d]} className="contents">
            <span className="text-[11px] leading-5 text-muted-foreground">{DIAS[d]}</span>
            {fila.map((n, s) => (
              <span key={s} className={cn("h-5 rounded", HEAT[nivel(n)])} title={`${n} cotizaciones`} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-end gap-1 text-[11px] text-muted-foreground" aria-hidden="true">
        Menos {HEAT.map((c) => <span key={c} className={cn("h-3 w-3 rounded-sm", c)} />)} Más
      </div>
    </DashboardCard>
  )
}
