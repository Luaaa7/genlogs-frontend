import { Link } from "react-router-dom"
import type { CotizacionEstadoItem } from "@/types/dashboard.types"
import { cn } from "@/lib/utils/utils"
import { ETIQUETA_ESTADO, normalizarEstado } from "../lib/calculos"
import { DashboardCard, SinDatos } from "./DashboardCard"

/** Etiquetas del dashboard más los dos estados de la aprobación interna (v3.3),
 *  con el mismo texto que la lista de cotizaciones. */
const ETIQUETAS: Record<string, string> = {
  ...ETIQUETA_ESTADO,
  PENDIENTE_APROBACION: "Pendiente de aprobación",
  APROBADA_INTERNA: "Aprobada por el Jefe",
  ACEPTADA_CLIENTE: "Aceptada por el cliente",
}

type Tono = "neutro" | "interno" | "cliente" | "exito" | "cerrada"

/** Color de cada estado con las variables del tema (claro y oscuro), sin naranja. */
const TONO_POR_ESTADO: Record<string, Tono> = {
  BORRADOR: "neutro",
  PENDIENTE_APROBACION: "interno",
  APROBADA_INTERNA: "interno",
  ENVIADA: "cliente",
  EN_NEGOCIACION: "cliente",
  APROBADA: "exito",
  ACEPTADA: "exito",
  ACEPTADA_CLIENTE: "exito",
  CONVERTIDA_OC: "exito",
  RECHAZADA: "cerrada",
  VENCIDA: "cerrada",
  ANULADA: "cerrada",
}

const COLOR_TONO: Record<Tono, string> = {
  neutro: "bg-muted-foreground/60",
  interno: "bg-viz-2",
  cliente: "bg-viz-1",
  exito: "bg-success",
  cerrada: "bg-destructive",
}

/** Cuántas cotizaciones hay en cada estado (barras horizontales con el color del estado). */
export function EstadosCotizacionCard({ estados }: { estados: CotizacionEstadoItem[] }) {
  const filas = [...estados].filter((e) => e.cantidad > 0).sort((a, b) => b.cantidad - a.cantidad)
  const maximo = Math.max(1, ...filas.map((e) => e.cantidad))
  const total = filas.reduce((s, e) => s + e.cantidad, 0)

  return (
    <DashboardCard
      id="dash-estados"
      titulo="Cotizaciones por estado"
      extra={<Link to="/cotizaciones" className="rounded text-[13px] font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Ver todas</Link>}
    >
      {filas.length === 0 ? (
        <SinDatos accion={{ label: "Crear la primera cotización", href: "/cotizaciones/nueva" }}>
          Sin cotizaciones registradas.
        </SinDatos>
      ) : (
        <ul className="flex flex-col gap-3">
          {filas.map((e) => {
            const codigo = normalizarEstado(e.estado)
            const tono = TONO_POR_ESTADO[codigo] ?? "interno"
            const porcentaje = Math.round((e.cantidad / total) * 100)
            return (
              <li key={e.estado} data-tono={tono} className="grid grid-cols-[128px_minmax(0,1fr)_56px] items-center gap-2.5 text-[13px]">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", COLOR_TONO[tono])} aria-hidden="true" />
                  <span className="truncate">{ETIQUETAS[codigo] ?? e.estado}</span>
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <span className={cn("block h-full rounded-full", COLOR_TONO[tono])} style={{ width: `${(e.cantidad / maximo) * 100}%` }} />
                </span>
                <span className="text-right tabular-nums">
                  <span className="font-semibold">{e.cantidad}</span>
                  <span className="ml-1 text-[11px] text-muted-foreground">{porcentaje}%</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </DashboardCard>
  )
}