import { Users, DollarSign, FileText, ShoppingCart, TrendingUp } from "lucide-react"
import { useDashboardData } from "../hooks/useDashboardData"
import { IndicadorCard } from "../components/IndicadorCard"
import { CotizacionesPorEstadoChart } from "../components/CotizacionesPorEstadoChart"
import { FacturacionChart } from "../components/FacturacionChart"
import { formatCurrency, formatPercentage } from "@/lib/formatters/currency"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function IndicadorSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border p-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-32 mt-2" />
        <Skeleton className="h-3 w-20 mt-1" />
      </div>
    </div>
  )
}

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border p-4 h-64", className)}>
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-full w-full" />
    </div>
  )
}

export function DashboardPage() {
  const {
    indicadores,
    facturacionHistorico,
    cotizacionesPorEstado,
    isLoading,
    isError,
    error,
    refetch,
  } = useDashboardData()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6 bg-linear-to-br from-sky-50 via-blue-50 to-cyan-100 min-h-screen items-center justify-center">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <IndicadorSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center bg-linear-to-br from-sky-50 via-blue-50 to-cyan-100">
        <div className="text-destructive">⚠️</div>
        <p className="text-sm text-destructive">
          No se pudieron cargar los datos del dashboard
        </p>
        <p className="text-xs text-muted-foreground">{error?.message}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 underline bg-linear-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-md shadow-blue-600/25 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!indicadores) return null

  const variacion = indicadores.porcentajeVariacionFacturacion ?? 0
  const clientesActivos = indicadores.clientesActivos ?? 0
  const totalFacturado = indicadores.totalFacturado ?? 0
  const cotizacionesPendientes = indicadores.cotizacionesPendientes ?? 0
  const ordenesCompraProceso = indicadores.ordenesCompraProceso ?? 0

  return (
    <div className="flex flex-col gap-6 p-6 bg-linear-to-br from-sky-50 via-blue-50 to-cyan-100 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
        <button
          onClick={refetch}
          className="px-4 py-2.5 text-xs font-medium text-slate-800 hover:text-slate-600 transition-colors bg-linear-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-md shadow-blue-600/25"
        >
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <IndicadorCard
          icon={Users}
          label="Clientes activos"
          value={String(clientesActivos)}
          trend={variacion}
          trendLabel={variacion >= 0 ? `+${variacion.toFixed(1)}%` : `${variacion.toFixed(1)}%`}
        />
        <IndicadorCard
          icon={DollarSign}
          label="Total facturado"
          value={formatCurrency(totalFacturado)}
          subtitle={`Variación: ${formatPercentage(variacion)}`}
        />
        <IndicadorCard
          icon={FileText}
          label="Cotizaciones pendientes"
          value={String(cotizacionesPendientes)}
          variant="highlight"
        />
        <IndicadorCard
          icon={ShoppingCart}
          label="Órdenes en proceso"
          value={String(ordenesCompraProceso)}
        />
        <IndicadorCard
          icon={TrendingUp}
          label="Variación facturación"
          value={`${variacion >= 0 ? "+" : ""}${variacion.toFixed(1)}%`}
          subtitle="vs mes anterior"
          variant={variacion >= 0 ? "default" : "highlight"}
        />
        <IndicadorCard
          icon={DollarSign}
          label="Ticket promedio"
          value={cotizacionesPendientes > 0
            ? formatCurrency(totalFacturado / Math.max(cotizacionesPendientes, 1))
            : formatCurrency(0)
          }
          subtitle="Estimado por cotización"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CotizacionesPorEstadoChart data={cotizacionesPorEstado ?? []} />
        <FacturacionChart data={facturacionHistorico ?? []} />
      </div>
    </div>
  )
}