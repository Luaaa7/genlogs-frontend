
import { cn } from "../../../lib/utils"
import { ETIQUETA_ESTADO_PROFORMA } from "@/types/proforma.types"
import type { EstadoProforma } from "@/types/proforma.types"

interface EstiloEstado {
  clases: string
  punto: string
}

const ESTILOS: Record<EstadoProforma, EstiloEstado> = {
  PENDIENTE: {
    clases: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    punto: "bg-amber-500",
  },
  APROBADA: {
    clases: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
    punto: "bg-emerald-500",
  },
  RECHAZADA: {
    clases: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
    punto: "bg-red-500",
  },
}

/** Tolera variantes en masculino que pueda enviar el backend. */
const ALIAS: Record<string, EstadoProforma> = {
  PENDIENTE: "PENDIENTE",
  APROBADA: "APROBADA",
  APROBADO: "APROBADA",
  RECHAZADA: "RECHAZADA",
  RECHAZADO: "RECHAZADA",
}

interface EstadoProformaBadgeProps {
  estado: EstadoProforma | string | null | undefined
  className?: string
}

export function EstadoProformaBadge({ estado, className }: EstadoProformaBadgeProps) {
  const conocido = ALIAS[String(estado ?? "").trim().toUpperCase()]

  const etiqueta = conocido ? ETIQUETA_ESTADO_PROFORMA[conocido] : estado ? String(estado) : "Sin estado"
  const estilo: EstiloEstado = conocido
    ? ESTILOS[conocido]
    : { clases: "bg-muted text-muted-foreground", punto: "bg-muted-foreground" }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        estilo.clases,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", estilo.punto)} aria-hidden="true" />
      {etiqueta}
    </span>
  )
}