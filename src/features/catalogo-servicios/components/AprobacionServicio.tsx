import type { Rol } from "@/lib/permisos"
import { usePermisos } from "@/lib/permisos"
import { mensajeError } from "@/lib/errores"
import type { EstadoAprobacionServicio } from "@/types/servicio.types"
import { useAprobarServicio } from "../hooks/useServicios"

const ROL_JEFE = "JEFE_ADMINISTRATIVO" satisfies Rol

interface Props {
  idServicio?: number
  estado?: EstadoAprobacionServicio | null
}

/** El servicio ya guardado en PENDIENTE_APROBACION. Aprobar solo lo ve el Jefe Administrativo. */
export function AprobacionServicio({ idServicio, estado }: Props) {
  const { rol } = usePermisos()
  const aprobar = useAprobarServicio(idServicio)
  if (estado !== "PENDIENTE_APROBACION") return null
  const esJefe = rol === ROL_JEFE

  return (
    <div className="sm:col-span-2 flex flex-wrap items-center gap-3 rounded-md border border-warning/40 bg-warning/10 p-3" role="status">
      <p className="text-sm text-foreground">Pendiente de aprobación</p>
      {esJefe && idServicio != null && (
        <button
          type="button"
          onClick={() => aprobar.mutate()}
          disabled={aprobar.isPending}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {aprobar.isPending ? "Aprobando..." : "Aprobar"}
        </button>
      )}
      {aprobar.isError && (
        <p role="alert" className="text-sm text-destructive">
          {mensajeError(aprobar.error, "No se pudo aprobar el servicio.")}
        </p>
      )}
    </div>
  )
}
