import { Users, DollarSign, FileText, ShoppingCart, TrendingUp, RefreshCw, Plus, BarChart3, ShoppingBag } from "lucide-react"
import { useDashboardData } from "../hooks/useDashboardData"
import { IndicadorCard } from "../components/IndicadorCard"
import { CotizacionesPorEstadoChart } from "../components/CotizacionesPorEstadoChart"
import { FacturacionChart } from "../components/FacturacionChart"
import { EmptyStateCard } from "../components/EmptyStateCard"
import { formatCurrency, formatPercentage } from "@/lib/formatters/currency"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function IndicadorSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-11 w-11 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-5 h-72", className)}>
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-full w-full" />
    </div>
  )
}

function EmptyChartsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartSkeleton />
      <ChartSkeleton />
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
      <div className="flex flex-col gap-6 p-6 bg-slate-50 min-h-screen">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <IndicadorSkeleton key={i} />
          ))}
        </div>
        <EmptyChartsSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center bg-slate-50 min-h-screen">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900">No se pudieron cargar los datos</h2>
          <p className="text-sm text-muted-foreground">{error?.message ?? "Error desconocido"}</p>
        </div>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
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
  const hasCotizaciones = cotizacionesPorEstado.length > 0
  const hasFacturacion = facturacionHistorico.length > 0

  const kpiCards = [
    {
      icon: Users,
      label: "Clientes activos",
      value: String(clientesActivos),
      trend: variacion,
      trendLabel: variacion >= 0 ? `+${variacion.toFixed(1)}%` : `${variacion.toFixed(1)}%`,
      iconBgColor: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      icon: DollarSign,
      label: "Total facturado",
      value: formatCurrency(totalFacturado),
      subtitle: `Variación: ${formatPercentage(variacion)}`,
      iconBgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: FileText,
      label: "Cotizaciones pendientes",
      value: String(cotizacionesPendientes),
      iconBgColor: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      icon: ShoppingCart,
      label: "Órdenes en proceso",
      value: String(ordenesCompraProceso),
      iconBgColor: "bg-violet-100",
      iconColor: "text-violet-600",
    },
    {
      icon: TrendingUp,
      label: "Variación facturación",
      value: `${variacion >= 0 ? "+" : ""}${variacion.toFixed(1)}%`,
      subtitle: "vs mes anterior",
      iconBgColor: variacion >= 0 ? "bg-emerald-100" : "bg-destructive/10",
      iconColor: variacion >= 0 ? "text-emerald-600" : "text-destructive",
    },
    {
      icon: DollarSign,
      label: "Ticket promedio",
      value:
        cotizacionesPendientes > 0
          ? formatCurrency(totalFacturado / Math.max(cotizacionesPendientes, 1))
          : formatCurrency(0),
      subtitle: "Estimado por cotización",
      iconBgColor: "bg-slate-100",
      iconColor: "text-slate-600",
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Dashboard</h1>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {kpiCards.map((card, index) => (
          <IndicadorCard key={index} {...card} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CotizacionesPorEstadoChart data={cotizacionesPorEstado ?? []} className="p-5 h-72" />
          {!hasCotizaciones && (
            <EmptyStateCard
              icon={
                <FileText className="h-7 w-7" strokeWidth={1.5} />
              }
              title="No hay cotizaciones aún"
              description="Comienza creando tu primera cotización para ver el desglose por estado en este gráfico."
              action={{
                label: "Crear cotización",
                href: "/cotizaciones/nueva",
              }}
            />
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <FacturacionChart data={facturacionHistorico ?? []} className="p-5 h-72" />
          {!hasFacturacion && (
            <EmptyStateCard
              icon={
                <BarChart3 className="h-7 w-7" strokeWidth={1.5} />
              }
              title="Sin datos de facturación"
              description="No hay facturación registrada para el periodo seleccionado. Los datos aparecerán aquí una vez que factures."
              action={{
                label: "Ver facturación",
                href: "/facturacion",
                variant: "outline",
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}