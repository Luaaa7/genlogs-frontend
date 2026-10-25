import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import type { Cotizacion } from "@/types/cotizacion.types"
import type { Factura } from "@/types/facturacion.types"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import { formatCurrency } from "@/lib/formatters/currency"
import { cn } from "@/lib/utils/utils"
import { calcularPendientes, iniciales } from "../lib/calculos"
import { DashboardCard, SinDatos } from "./DashboardCard"

const PERIODOS = [
  { clave: "hoy", label: "Hoy", dias: 0 },
  { clave: "semana", label: "Semana", dias: 7 },
  { clave: "mes", label: "Mes", dias: 30 },
] as const
type Periodo = (typeof PERIODOS)[number]["clave"]

const MAX_FILAS = 5

/** Lo que vence o ya venció: cotizaciones abiertas y facturas por cobrar.
 *  Es el primer bloque del dashboard porque es lo que se trabaja cada día. */
export function RequiereAtencionCard({ cotizaciones, facturas, className }: { cotizaciones: Cotizacion[]; facturas: Factura[]; className?: string }) {
  const [periodo, setPeriodo] = useState<Periodo>("semana")
  const dias = PERIODOS.find((p) => p.clave === periodo)!.dias
  const pendientes = useMemo(() => calcularPendientes(cotizaciones, facturas, new Date(), dias), [cotizaciones, facturas, dias])

  const selector = (
    <div role="group" aria-label="Periodo" className="flex gap-0.5">
      {PERIODOS.map((p) => (
        <button
          key={p.clave}
          type="button"
          aria-pressed={periodo === p.clave}
          onClick={() => setPeriodo(p.clave)}
          className={cn(
            "h-7 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            periodo === p.clave ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  )

  return (
    <DashboardCard id="dash-atencion" titulo="Requiere atención" extra={selector} className={className}>
      {pendientes.length === 0 ? (
        <SinDatos>Nada vence en este periodo. Todo al día.</SinDatos>
      ) : (
        <ul className="divide-y divide-border">
          {pendientes.slice(0, MAX_FILAS).map((p) => (
            <li key={p.clave} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent" aria-hidden="true">
                {iniciales(p.cliente)}
              </span>
              <div className="min-w-0 flex-1 basis-48">
                <Link to={p.href} className="text-sm font-semibold tabular-nums text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                  {p.documento}
                </Link>
                <p className="truncate text-[13px] text-muted-foreground">{p.cliente} · {p.tipo}</p>
              </div>
              <EstadoBadge tono={p.urgencia === "vencido" ? "destructive" : "warning"}>{p.motivo}</EstadoBadge>
              <span className="w-28 text-right text-sm font-semibold tabular-nums">{formatCurrency(p.monto, p.moneda)}</span>
            </li>
          ))}
        </ul>
      )}
      {pendientes.length > MAX_FILAS && (
        <p className="mt-2 text-[13px] text-muted-foreground">Y {pendientes.length - MAX_FILAS} más en este periodo.</p>
      )}
    </DashboardCard>
  )
}
