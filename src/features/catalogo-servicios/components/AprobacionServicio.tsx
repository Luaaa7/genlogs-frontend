import type { Rol } from "@/lib/permisos"
import { usePermisos } from "@/lib/permisos"
import { mensajeError } from "@/lib/errores"
import type { EstadoAprobacionServicio } from "@/types/servicio.types"
import { useAprobarServicio, useRechazarServicio } from "../hooks/useServicios"

const ROL_JEFE = "JEFE_ADMINISTRATIVO" satisfies Rol

interface Props {
  idServicio?: number
  estado?: EstadoAprobacionServicio | null
}

/**
 * Estado de aprobación del servicio ya guardado. Aprobar y rechazar solo los ve el Jefe
 * Administrativo; el backend además impide decidir sobre un servicio que él mismo dejó pendiente.
 */
export function AprobacionServicio({ idServicio, estado }: Props) {
  const { rol } = usePermisos()
  const aprobar = useAprobarServicio(idServicio)
  const rechazar = useRechazarServicio(idServicio)

  if (estado === "RECHAZADO") {
    return (
      <div className="sm:col-span-2 rounded-md border border-destructive/40 bg-destructive/10 p-3" role="status">
        <p className="text-sm text-foreground">
          Rechazado por el Jefe Administrativo. Corrige el costo, el margen o el precio y guarda para volver a evaluarlo.
        </p>
      </div>
    )
  }
  if (estado !== "PENDIENTE_APROBACION") return null

  const esJefe = rol === ROL_JEFE
  const ocupado = aprobar.isPending || rechazar.isPending
  const error = aprobar.isError ? aprobar.error : rechazar.isError ? rechazar.error : null

  return (
    <div className="sm:col-span-2 flex flex-wrap items-center gap-3 rounded-md border border-warning/40 bg-warning/10 p-3" role="status">
      <p className="text-sm text-foreground">Pendiente de aprobación</p>
      {esJefe && idServicio != null && (
        <>
          <button
            type="button"
            onClick={() => aprobar.mutate()}
            disabled={ocupado}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {aprobar.isPending ? "Aprobando..." : "Aprobar"}
          </button>
          <button
            type="button"
            onClick={() => rechazar.mutate()}
            disabled={ocupado}
            className="rounded-md border border-destructive px-3 py-1.5 text-sm font-medium text-destructive disabled:opacity-50"
          >
            {rechazar.isPending ? "Rechazando..." : "Rechazar"}
          </button>
        </>
      )}
      {error != null && (
        <p role="alert" className="w-full text-sm text-destructive">
          {mensajeError(error, aprobar.isError ? "No se pudo aprobar el servicio." : "No se pudo rechazar el servicio.")}
        </p>
      )}
    </div>
  )
}
