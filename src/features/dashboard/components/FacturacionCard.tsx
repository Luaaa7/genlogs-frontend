import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { FacturacionHistoricoItem } from "@/types/dashboard.types"
import { formatCurrency } from "@/lib/formatters/currency"
import { cn } from "@/lib/utils/utils"
import { etiquetaMes } from "../lib/calculos"
import { DashboardCard, SinDatos } from "./DashboardCard"

interface FacturacionCardProps {
  historico: FacturacionHistoricoItem[]
  totalFacturado: number
  variacion: number
  className?: string
}

const miles = (v: number) => `${(v / 1000).toLocaleString("es-PE", { maximumFractionDigits: 1 })} mil`

/** Curva de facturación mensual con el mejor mes marcado, y tres cifras debajo. */
export function FacturacionCard({ historico, totalFacturado, variacion, className }: FacturacionCardProps) {
  const datos = historico.map((h) => ({ mes: etiquetaMes(h.mes), monto: h.monto }))
  const pico = datos.reduce<(typeof datos)[number] | null>((mejor, d) => (!mejor || d.monto > mejor.monto ? d : mejor), null)

  return (
    <DashboardCard
      id="dash-facturacion"
      titulo="Facturación mensual"
      extra={<span className="text-xs text-muted-foreground">Soles, sin IGV</span>}
      className={cn("flex flex-col", className)}
    >
      {datos.length === 0 ? (
        <SinDatos>Aún no hay facturas emitidas. La curva aparecerá con la primera factura.</SinDatos>
      ) : (
        <div className="h-56 lg:h-auto lg:min-h-56 lg:flex-1" role="img" aria-label={`Facturación mensual; el mejor mes fue ${pico?.mes} con ${formatCurrency(pico?.monto ?? 0)}`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={datos} margin={{ top: 28, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} width={56} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={miles} />
              <Tooltip
                cursor={{ stroke: "var(--border)" }}
                formatter={(v) => [formatCurrency(Number(v)), "Facturado"]}
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--foreground)", fontSize: 13 }}
              />
              <Area type="monotone" dataKey="monto" stroke="var(--viz-1)" strokeWidth={3} fill="var(--viz-2)" fillOpacity={0.16} />
              {pico && (
                <ReferenceDot
                  x={pico.mes}
                  y={pico.monto}
                  r={6}
                  fill="var(--card)"
                  stroke="var(--viz-3)"
                  strokeWidth={3}
                  label={{ value: miles(pico.monto), position: "top", fill: "var(--viz-3-text)", fontSize: 12, fontWeight: 600 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <dl className="mt-5 grid grid-cols-3 border-t border-border pt-5 text-center">
        <div>
          <dt className="text-xs text-muted-foreground">Total facturado</dt>
          <dd className="mt-1.5 text-xl font-semibold tabular-nums text-viz-1">{miles(totalFacturado)}</dd>
        </div>
        <div className="border-x border-border">
          <dt className="text-xs text-muted-foreground">Mejor mes</dt>
          <dd className="mt-1.5 text-xl font-semibold tabular-nums text-viz-1">{pico ? pico.mes : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Vs. mes anterior</dt>
          <dd className={cn("mt-1.5 text-xl font-semibold tabular-nums", variacion < 0 ? "text-destructive" : "text-success")}>
            {variacion > 0 ? "+" : ""}{variacion.toFixed(1)}%
          </dd>
        </div>
      </dl>

      <Link to="/facturacion" className="mt-4 inline-flex items-center gap-1 self-end rounded text-sm font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Ver facturación <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </DashboardCard>
  )
}
