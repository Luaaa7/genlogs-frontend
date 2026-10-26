import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, RefreshCw, AlertTriangle } from "lucide-react"
import { useDashboardData } from "../hooks/useDashboardData"
import { useDashboardOperativo } from "../hooks/useDashboardOperativo"
import { RequiereAtencionCard } from "../components/RequiereAtencionCard"
import { FacturacionCard } from "../components/FacturacionCard"
import { KpiColorCard } from "../components/KpiColorCard"
import { CotizacionesPorMesCard } from "../components/CotizacionesPorMesCard"
import { TasaAprobacionCard } from "../components/TasaAprobacionCard"
import { CotizadoVsFacturadoCard } from "../components/CotizadoVsFacturadoCard"
import { EstadosCotizacionCard } from "../components/EstadosCotizacionCard"
import { MejoresClientesCard } from "../components/MejoresClientesCard"
import {
  actividadPorDia,
  calcularPendientes,
  contarFacturasVencidas,
  cotizacionesPorMes,
  cotizadoPorMes,
  facturadoPorMes,
  monedasDelDashboard,
  resumenFacturacionMes,
  etiquetaMes,
  formatearMontos,
  mejoresClientes,
  montoCotizadoPorMoneda,
  resumenPendientes,
  tasaAprobacion,
} from "../lib/calculos"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/features/auth/store/authStore"

/** Saludo según la hora del día. */
function saludo() {
  const hora = new Date().getHours()
  if (hora < 12) return "Buenos días"
  if (hora < 19) return "Buenas tardes"
  return "Buenas noches"
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-12" aria-hidden="true">
      <Skeleton variant="rectangular" className="h-64 lg:col-span-7" />
      <Skeleton variant="rectangular" className="h-64 lg:col-span-5 lg:row-span-2 lg:h-auto" />
      <Skeleton variant="rectangular" className="h-40 lg:col-span-4" />
      <Skeleton variant="rectangular" className="h-40 lg:col-span-3" />
      <Skeleton variant="rectangular" className="h-96 lg:col-span-4" />
      <Skeleton variant="rectangular" className="h-96 lg:col-span-4" />
      <Skeleton variant="rectangular" className="h-96 lg:col-span-4" />
    </div>
  )
}

export function DashboardPage() {
  const nombreUsuario = useAuthStore((s) => s.nombreUsuario)
  const { indicadores, cotizacionesPorEstado, isLoading, isError, error, refetch } = useDashboardData()
  const operativo = useDashboardOperativo()

  const fechaHoy = new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  // Las gráficas de montos se ven en UNA moneda a la vez: no se mezclan dólares con soles.
  const monedas = useMemo(() => monedasDelDashboard(operativo.cotizaciones, operativo.facturas), [operativo.cotizaciones, operativo.facturas])
  const [monedaElegida, setMonedaElegida] = useState<string | null>(null)
  const moneda = monedaElegida && monedas.includes(monedaElegida) ? monedaElegida : (monedas[0] ?? "PEN")

  const calculado = useMemo(() => {
    const hoy = new Date()
    const { cotizaciones, facturas } = operativo
    const porMes6 = cotizadoPorMes(cotizaciones, hoy, 6, moneda)
    const facturacionHistorico = facturadoPorMes(facturas, moneda)
    const facturadoPorEtiqueta = new Map(facturacionHistorico.map((h) => [etiquetaMes(h.mes), h.monto]))
    return {
      facturacionHistorico,
      resumenMes: resumenFacturacionMes(facturacionHistorico, hoy),
      porMes: cotizacionesPorMes(cotizaciones, hoy, 4),
      actividad: actividadPorDia(cotizaciones, hoy, 6),
      cotizadoVsFacturado: porMes6.map((m) => ({ mes: m.etiqueta, cotizado: m.cotizado, facturado: facturadoPorEtiqueta.get(m.etiqueta) ?? 0 })),
      // Tendencia de la tarjeta de cotizaciones: cuántas se emitieron cada mes
      serieCotizaciones: cotizacionesPorMes(cotizaciones, hoy, 6).map((m) => m.aprobadas + m.enCurso + m.rechazadas),
      vencenSemana: calcularPendientes(cotizaciones, [], hoy, 7).filter((p) => p.urgencia === "proximo").length,
      facturasVencidas: contarFacturasVencidas(facturas, hoy),
      // Los montos van por moneda: no se suman dólares con soles.
      montoCotizado: formatearMontos(montoCotizadoPorMoneda(cotizaciones)),
      pendientes: resumenPendientes(cotizaciones),
      clientes: mejoresClientes(facturas, hoy, 3),
    }
  }, [operativo, moneda])

  const actualizar = () => {
    refetch()
    operativo.refetch()
  }

  const encabezado = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {saludo()}{nombreUsuario ? `, ${nombreUsuario}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{fechaHoy}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {monedas.length > 1 && (
          <div role="group" aria-label="Moneda de las gráficas" className="inline-flex overflow-hidden rounded-md border border-border">
            {monedas.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={m === moneda}
                onClick={() => setMonedaElegida(m)}
                className={
                  "px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                  (m === moneda ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted")
                }
              >
                {m}
              </button>
            ))}
          </div>
        )}
        <Button variant="outline" onClick={actualizar}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Actualizar
        </Button>
        <Button asChild>
          <Link to="/cotizaciones/nueva">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Nueva cotización
          </Link>
        </Button>
      </div>
    </div>
  )

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        {encabezado}
        <div role="alert" className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">No se pudieron cargar los indicadores</h2>
            <p className="mt-1 text-sm text-muted-foreground">{error?.message ?? "Revisa tu conexión e inténtalo de nuevo."}</p>
          </div>
          <Button onClick={actualizar}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  const totalEmitidas = cotizacionesPorEstado.reduce((s, e) => s + e.cantidad, 0)

  return (
    <div className="flex flex-col gap-6">
      {encabezado}

      {isLoading || operativo.isLoading ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          <RequiereAtencionCard cotizaciones={operativo.cotizaciones} facturas={operativo.facturas} className="lg:col-span-7" />

          <FacturacionCard
            historico={calculado.facturacionHistorico}
            totalFacturado={calculado.resumenMes.actual}
            variacion={calculado.resumenMes.variacion}
            moneda={moneda}
            className="lg:col-span-5 lg:row-span-2"
          />

          <div className="grid gap-4 sm:grid-cols-[4fr_3fr] lg:col-span-7">
            <KpiColorCard
              tono="navy"
              titulo="Cotizaciones pendientes"
              valor={String(indicadores.cotizacionesPendientes ?? 0)}
              detalle={calculado.pendientes.cantidad > 0 ? `${formatearMontos(calculado.pendientes.montos)} por cerrar` : undefined}
              serie={calculado.serieCotizaciones}
              href="/cotizaciones"
            />
            <KpiColorCard
              tono="blue"
              titulo="Órdenes en proceso"
              valor={String(indicadores.ordenesCompraProceso ?? 0)}
              detalle={`${indicadores.clientesActivos ?? 0} clientes activos`}
              href="/ordenes-compra"
            />
          </div>

          <CotizacionesPorMesCard porMes={calculado.porMes} actividad={calculado.actividad} className="lg:col-span-4" />

          <div className="flex flex-col gap-4 lg:col-span-4">
            <TasaAprobacionCard
              tasa={tasaAprobacion(cotizacionesPorEstado)}
              totalEmitidas={totalEmitidas}
              montoCotizado={calculado.montoCotizado}
              vencenSemana={calculado.vencenSemana}
              facturasVencidas={calculado.facturasVencidas}
            />
            <CotizadoVsFacturadoCard datos={calculado.cotizadoVsFacturado} moneda={moneda} />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-4">
            <EstadosCotizacionCard estados={cotizacionesPorEstado} />
            <MejoresClientesCard clientes={calculado.clientes} />
          </div>
        </div>
      )}
    </div>
  )
}
