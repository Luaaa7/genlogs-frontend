import { Link } from "react-router-dom"
import { ShieldAlert } from "lucide-react"
import { mensajeError } from "@/lib/errores"
import { PageHeader } from "@/components/ui/PageHeader"
import { EstadoVacio } from "@/components/ui/EstadoVacio"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Skeleton } from "@/components/ui/skeleton"
import type { NotificacionResponse } from "@/api/contratos"
import { useAlertasDocumentos, useMarcarAlertaLeida } from "../hooks/useAlertasDocumentos"
import { ordenarAlertas, tramoDe } from "../lib/alertas"

/** Color según el tramo: 7 días urgente, 15 días atención, 30 días informativo. */
function estiloTramo(tramo: number | null): string {
  if (tramo === 7) return "border-destructive/40 bg-destructive/10 text-destructive"
  if (tramo === 15) return "border-warning/40 bg-warning/10 text-foreground"
  return "border-border bg-muted text-muted-foreground"
}

function fechaCorta(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(fecha)
}

function Fila({ alerta }: { alerta: NotificacionResponse }) {
  const marcar = useMarcarAlertaLeida()
  const tramo = tramoDe(alerta.titulo)
  return (
    <li
      className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card px-4 py-3 ${alerta.leida ? "border-border opacity-70" : "border-primary/40"}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {tramo != null && (
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${estiloTramo(tramo)}`}>{tramo} días</span>
          )}
          <p className="text-sm font-medium text-foreground">{alerta.titulo}</p>
        </div>
        {alerta.mensaje && <p className="mt-1 text-sm text-muted-foreground">{alerta.mensaje}</p>}
        <p className="mt-1 text-xs text-muted-foreground">
          Aviso del {fechaCorta(alerta.fechaCreacion)}{alerta.leida ? " · Leído" : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {alerta.enlace && (
          <Link to={alerta.enlace} className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
            Ver órdenes de compra
          </Link>
        )}
        {!alerta.leida && (
          <button
            type="button"
            onClick={() => marcar.mutate(alerta.idNotificacion)}
            disabled={marcar.isPending}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Marcar como leído
          </button>
        )}
      </div>
      {marcar.isError && (
        <p role="alert" className="w-full text-sm text-destructive">{mensajeError(marcar.error, "No se pudo marcar el aviso.")}</p>
      )}
    </li>
  )
}

/** PASE y SCTR por vencer (avisos de 30, 15 y 7 días que crea la tarea diaria del backend). */
export function AlertasDocumentosPage() {
  const { data, isLoading, isError, error, refetch } = useAlertasDocumentos()
  const alertas = ordenarAlertas(data ?? [])
  const sinLeer = alertas.filter((a) => !a.leida).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="PASE y SCTR por vencer"
        descripcion={sinLeer > 0 ? `${sinLeer} aviso${sinLeer === 1 ? "" : "s"} sin leer` : "Avisos a los 30, 15 y 7 días del vencimiento"}
      />
      {isError && <ErrorBanner message="No se pudieron cargar los avisos." error={error} onRetry={() => refetch()} />}
      {isLoading && (
        <div role="status" aria-label="Cargando los avisos" className="flex flex-col gap-3">
          <Skeleton variant="rectangular" className="h-16 w-full" />
          <Skeleton variant="rectangular" className="h-16 w-full" />
        </div>
      )}
      {!isLoading && !isError && alertas.length === 0 && (
        <EstadoVacio
          icono={<ShieldAlert className="h-6 w-6" />}
          titulo="No hay PASE ni SCTR por vencer"
          descripcion="Cuando a un documento le falten 30, 15 o 7 días, el aviso aparecerá aquí."
        />
      )}
      {!isLoading && !isError && alertas.length > 0 && (
        <ul className="flex flex-col gap-3">
          {alertas.map((alerta) => (
            <Fila key={alerta.idNotificacion} alerta={alerta} />
          ))}
        </ul>
      )}
    </div>
  )
}
