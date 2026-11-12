import { mensajeError } from "@/lib/errores"
import type { MetaPeriodo } from "@/api/metasApi"
import { DashboardCard } from "./DashboardCard"
import { useMetaPeriodo } from "../hooks/useMetaPeriodo"
import { periodoActualLima } from "../lib/periodoLima"

function nombreMes(anio: number, mes: number): string {
  const texto = new Intl.DateTimeFormat("es-PE", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(anio, mes - 1, 1)))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function textoPorcentaje(valor: number): string {
  return `${valor.toLocaleString("es-PE", { maximumFractionDigits: 2 })}%`
}

function Cuerpo({ meta }: { meta: MetaPeriodo }) {
  const sinPorcentaje = meta.porcentaje == null
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">{nombreMes(meta.anio, meta.mes)}</p>
      <p className="text-sm text-muted-foreground">Meta {textoPorcentaje(meta.metaPorcentaje)}</p>
      <p className="text-4xl font-bold tracking-tight tabular-nums">{sinPorcentaje ? "—" : textoPorcentaje(meta.porcentaje as number)}</p>
      <p className="text-sm text-muted-foreground">
        {meta.cotizacionesEnPlazo} de {meta.cotizacionesConsideradas} cotizaciones en el plazo
      </p>
      {!sinPorcentaje && meta.cumple === true && (
        <p className="text-sm text-foreground">El mes va dentro de la meta.</p>
      )}
      {!sinPorcentaje && meta.cumple === false && (
        <p className="text-sm text-foreground">Quedó por debajo de la meta. El Jefe registra la acción.</p>
      )}
    </div>
  )
}

/** Porcentaje de cotizaciones en plazo del mes actual. El número lo manda el backend. */
export function MetaPlazoCard() {
  const { anio, mes } = periodoActualLima()
  const { data, isLoading, isError, error, refetch } = useMetaPeriodo(anio, mes)

  return (
    <DashboardCard id="dash-meta-plazo" titulo="Cotizaciones en el plazo">
      {isLoading && <p role="status" className="text-sm text-muted-foreground">Cargando la meta del mes…</p>}
      {isError && (
        <div role="alert" className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-destructive">{mensajeError(error, "No se pudo cargar la meta del mes.")}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Reintentar
          </button>
        </div>
      )}
      {data && <Cuerpo meta={data} />}
    </DashboardCard>
  )
}
