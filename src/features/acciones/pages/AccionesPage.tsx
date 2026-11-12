import { useState, type FormEvent } from "react"
import { useSearchParams } from "react-router-dom"
import { ListChecks } from "lucide-react"
import type { Rol } from "@/lib/permisos"
import { usePermisos } from "@/lib/permisos"
import { mensajeError } from "@/lib/errores"
import { PageHeader } from "@/components/ui/PageHeader"
import { EstadoVacio } from "@/components/ui/EstadoVacio"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Skeleton } from "@/components/ui/skeleton"
import type { AccionCorrectiva } from "@/api/metasApi"
import { periodoActualLima } from "@/features/dashboard/lib/periodoLima"
import { useAcciones, useCrearAccion, useMarcarAccionHecha } from "../hooks/useAcciones"

const ROL_JEFE = "JEFE_ADMINISTRATIVO" satisfies Rol

function periodoDe(params: URLSearchParams): { anio: number; mes: number } {
  const anio = Number(params.get("anio"))
  const mes = Number(params.get("mes"))
  if (Number.isInteger(anio) && anio >= 2000 && anio <= 2100 && Number.isInteger(mes) && mes >= 1 && mes <= 12) {
    return { anio, mes }
  }
  return periodoActualLima()
}

function nombreMes(anio: number, mes: number): string {
  const texto = new Intl.DateTimeFormat("es-PE", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(anio, mes - 1, 1)))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function FormularioAccion({ anio, mes }: { anio: number; mes: number }) {
  const [descripcion, setDescripcion] = useState("")
  const [aviso, setAviso] = useState<string | null>(null)
  const crear = useCrearAccion(anio, mes)

  function enviar(e: FormEvent) {
    e.preventDefault()
    const texto = descripcion.trim()
    if (!texto) {
      setAviso("La descripción no puede ir vacía.")
      return
    }
    setAviso(null)
    crear.mutate(texto, { onSuccess: () => setDescripcion("") })
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <label htmlFor="accion-descripcion" className="text-sm font-medium text-foreground">Descripción</label>
      <textarea
        id="accion-descripcion"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-border px-3 py-2 text-sm"
      />
      {aviso && <p role="alert" className="text-sm text-destructive">{aviso}</p>}
      {crear.isError && <p role="alert" className="text-sm text-destructive">{mensajeError(crear.error, "No se pudo registrar la acción.")}</p>}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={crear.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {crear.isPending ? "Registrando..." : "Registrar acción"}
        </button>
      </div>
    </form>
  )
}

function Fila({ accion, esJefe, anio, mes }: { accion: AccionCorrectiva; esJefe: boolean; anio: number; mes: number }) {
  const marcar = useMarcarAccionHecha(anio, mes)
  const pendiente = accion.estado === "PENDIENTE"
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm text-foreground">{accion.descripcion}</p>
        <p className="text-xs text-muted-foreground">{pendiente ? "Pendiente" : "Hecha"}</p>
      </div>
      {esJefe && pendiente && (
        <button
          type="button"
          onClick={() => marcar.mutate(accion.id)}
          disabled={marcar.isPending}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          Marcar como hecha
        </button>
      )}
      {marcar.isError && <p role="alert" className="w-full text-sm text-destructive">{mensajeError(marcar.error, "No se pudo marcar la acción.")}</p>}
    </li>
  )
}

/** Acciones correctivas del mes. No calcula la meta ni el porcentaje. */
export function AccionesPage() {
  const [params] = useSearchParams()
  const { anio, mes } = periodoDe(params)
  const esJefe = usePermisos().rol === ROL_JEFE
  const { data, isLoading, isError, error, refetch } = useAcciones(anio, mes)
  const acciones = data ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Acciones correctivas"
        descripcion={nombreMes(anio, mes)}
      />
      {isError && <ErrorBanner message="No se pudieron cargar las acciones." error={error} onRetry={() => refetch()} />}
      {esJefe && <FormularioAccion anio={anio} mes={mes} />}
      {isLoading && (
        <div role="status" aria-label="Cargando las acciones" className="flex flex-col gap-3">
          <Skeleton variant="rectangular" className="h-16 w-full" />
          <Skeleton variant="rectangular" className="h-16 w-full" />
        </div>
      )}
      {!isLoading && !isError && acciones.length === 0 && (
        <EstadoVacio icono={<ListChecks className="h-6 w-6" />} titulo="No hay acciones este mes" descripcion="Las acciones no se crean solas." />
      )}
      {!isLoading && !isError && acciones.length > 0 && (
        <ul className="flex flex-col gap-3">
          {acciones.map((accion) => (
            <Fila key={accion.id} accion={accion} esJefe={esJefe} anio={anio} mes={mes} />
          ))}
        </ul>
      )}
    </div>
  )
}
