import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts"
import { formatCurrency } from "@/lib/formatters/currency"
import { DashboardCard, SinDatos } from "./DashboardCard"

export interface PuntoCotizadoFacturado { mes: string; cotizado: number; facturado: number }

/** Dos líneas por mes: lo cotizado (sólida) y lo facturado (punteada). */
export function CotizadoVsFacturadoCard({ datos }: { datos: PuntoCotizadoFacturado[] }) {
  const hayDatos = datos.some((d) => d.cotizado > 0 || d.facturado > 0)

  return (
    <DashboardCard id="dash-cot-fac" titulo="Cotizado vs. facturado">
      {!hayDatos ? (
        <SinDatos>Sin montos en los últimos meses.</SinDatos>
      ) : (
        <>
          <div className="h-32" role="img" aria-label={datos.map((d) => `${d.mes}: cotizado ${formatCurrency(d.cotizado)}, facturado ${formatCurrency(d.facturado)}`).join("; ")}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datos} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <Tooltip
                  formatter={(v, nombre) => [formatCurrency(Number(v)), nombre]}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)", fontSize: 13 }}
                />
                <Line type="monotone" dataKey="cotizado" name="Cotizado" stroke="var(--viz-1)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="facturado" name="Facturado" stroke="var(--viz-3)" strokeWidth={2.5} strokeDasharray="6 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2.5 flex gap-4 text-xs text-muted-foreground">
            <li className="inline-flex items-center gap-1.5"><span className="h-0.75 w-3.5 bg-viz-1" aria-hidden="true" />Cotizado</li>
            <li className="inline-flex items-center gap-1.5"><span className="w-3.5 border-t-3 border-dashed border-viz-3" aria-hidden="true" />Facturado</li>
          </ul>
        </>
      )}
    </DashboardCard>
  )
}
