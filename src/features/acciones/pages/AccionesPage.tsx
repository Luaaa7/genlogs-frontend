import { useState, type FormEvent, type KeyboardEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, ListChecks, RotateCcw } from "lucide-react"
import type { Rol } from "@/lib/permisos"
import { usePermisos } from "@/lib/permisos"
import { mensajeError } from "@/lib/errores"
import { cn } from "@/lib/utils/utils"
import { PageHeader } from "@/components/ui/PageHeader"
import { EstadoVacio } from "@/components/ui/EstadoVacio"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Campo } from "@/components/ui/campo"
import { describedBy, textareaFormClass } from "@/components/ui/campoEstilos"
import type { AccionCorrectiva, MetaPeriodo } from "@/api/metasApi"
import { periodoActualLima } from "@/features/dashboard/lib/periodoLima"
import { useMetaPeriodo } from "@/features/dashboard/hooks/useMetaPeriodo"
import { useAcciones, useCambiarEstadoAccion, useCrearAccion } from "../hooks/useAcciones"

const ROL_JEFE = "JEFE_ADMINISTRATIVO" satisfies Rol
/** v3.4: límite de la descripción. La columna es TEXT; el límite es para que la lista siga legible. */
const MAX_DESCRIPCION = 500

type Periodo = { anio: number; mes: number }

function periodoDe(params: URLSearchParams): Periodo {
  const anio = Number(params.get("anio"))
  const mes = Number(params.get("mes"))
  if (Number.isInteger(anio) && anio >= 2000 && anio <= 2100 && Number.isInteger(mes) && mes >= 1 && mes <= 12) {
    return { anio, mes }
  }
  return periodoActualLima()
}

function moverMes({ anio, mes }: Periodo, delta: number): Periodo {
  const total = anio * 12 + (mes - 1) + delta
  return { anio: Math.floor(total / 12), mes: (total % 12) + 1 }
}

function rutaPeriodo({ anio, mes }: Periodo): string {
  return `/acciones?anio=${anio}&mes=${mes}`
}

function nombreMes(anio: number, mes: number): string {
  const texto = new Intl.DateTimeFormat("es-PE", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(anio, mes - 1, 1)))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function fechaCorta(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ""
  return new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", year: "numeric" }).format(fecha)
}

/** Mes anterior / siguiente. No pasa del mes actual: no hay acciones del futuro. */
function NavegacionMes({ periodo }: { periodo: Periodo }) {
  const actual = periodoActualLima()
  const esActual = periodo.anio === actual.anio && periodo.mes === actual.mes
  const enlace = "inline-flex h-9 items-center gap-1 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  return (
    <nav aria-label="Cambiar de mes" className="flex flex-wrap items-center gap-2">
      <Link to={rutaPeriodo(moverMes(periodo, -1))} className={enlace}>
        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Mes anterior
      </Link>
      {!esActual && (
        <>
          <Link to={rutaPeriodo(moverMes(periodo, 1))} className={enlace}>
            Mes siguiente <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link to={rutaPeriodo(actual)} className="text-sm font-medium text-accent hover:underline">Ir al mes actual</Link>
        </>
      )}
    </nav>
  )
}

/** Resultado de la meta del mes: el porqué de las acciones correctivas. */
function ResultadoMeta({ meta }: { meta: MetaPeriodo | undefined }) {
  if (!meta || typeof meta.metaPorcentaje !== "number") return null
  const sinDatos = meta.porcentaje === null || meta.cumple === null
  const tono = sinDatos ? "border-border bg-card" : meta.cumple ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10"
  return (
    <section aria-label="Resultado de la meta del mes" className={cn("rounded-xl border px-4 py-3 text-sm", tono)}>
      {sinDatos ? (
        <p className="text-muted-foreground">
          Todavía no hay cotizaciones con fecha límite este mes. La meta es {meta.metaPorcentaje}% respondidas en plazo.
        </p>
      ) : (
        <p className="text-foreground">
          <span className="font-semibold">{meta.porcentaje}% en plazo</span> ({meta.cotizacionesEnPlazo} de {meta.cotizacionesConsideradas}),
          {" "}meta {meta.metaPorcentaje}%:{" "}
          <span className={cn("font-semibold", meta.cumple ? "text-success" : "text-destructive")}>
            {meta.cumple ? "cumple" : "no cumple"}
          </span>
          {!meta.cumple && <span className="text-muted-foreground"> · Registra qué se hará para mejorar.</span>}
        </p>
      )}
    </section>
  )
}

function FormularioAccion({ anio, mes }: Periodo) {
  const [descripcion, setDescripcion] = useState("")
  const [aviso, setAviso] = useState<string | null>(null)
  const crear = useCrearAccion(anio, mes)
  const id = "accion-descripcion"
  const error = aviso ?? (crear.isError ? mensajeError(crear.error, "No se pudo registrar la acción.") : undefined)

  function enviar(e?: FormEvent) {
    e?.preventDefault()
    const texto = descripcion.trim()
    if (!texto) {
      setAviso("La descripción no puede ir vacía.")
      return
    }
    if (texto.length > MAX_DESCRIPCION) {
      setAviso(`La descripción admite hasta ${MAX_DESCRIPCION} caracteres.`)
      return
    }
    setAviso(null)
    crear.mutate(texto, { onSuccess: () => setDescripcion("") })
  }

  function atajo(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) enviar()
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4" noValidate>
      <Campo id={id} label="Descripción" error={error} ayuda="Qué se hará, quién y para cuándo. Ctrl + Enter para registrar.">
        <textarea
          id={id}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          onKeyDown={atajo}
          rows={3}
          maxLength={MAX_DESCRIPCION}
          placeholder="Ej.: Revisar con compras las solicitudes atrasadas antes del día 15."
          aria-invalid={!!error}
          aria-describedby={describedBy(id, { error, ayuda: true })}
          className={textareaFormClass}
        />
      </Campo>
      {/* Margen a la derecha: algunas extensiones de dictado ponen un botón flotante en esa esquina. */}
      <div className="flex items-center justify-between gap-3 pr-12 sm:pr-14">
        <span className="text-xs tabular-nums text-muted-foreground">
          {descripcion.length}/{MAX_DESCRIPCION}
        </span>
        <Button type="submit" disabled={crear.isPending}>
          {crear.isPending ? "Registrando..." : "Registrar acción"}
        </Button>
      </div>
    </form>
  )
}

function Fila({ accion, esJefe, anio, mes }: { accion: AccionCorrectiva; esJefe: boolean } & Periodo) {
  const cambiar = useCambiarEstadoAccion(anio, mes)
  const pendiente = accion.estado === "PENDIENTE"
  const fecha = fechaCorta(accion.fecha)
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {pendiente
          ? <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-warning-text" aria-hidden="true" />
          : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />}
        <div className="min-w-0">
          <p className={cn("whitespace-pre-line break-words text-sm text-foreground", !pendiente && "text-muted-foreground line-through")}>
            {accion.descripcion}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className={cn("font-medium", pendiente ? "text-warning-text" : "text-success")}>{pendiente ? "Pendiente" : "Hecha"}</span>
            {fecha && <> · Registrada el {fecha}</>}
          </p>
        </div>
      </div>
      {esJefe && (
        <Button
          type="button"
          variant={pendiente ? "outline" : "ghost"}
          size="sm"
          onClick={() => cambiar.mutate({ id: accion.id, estado: pendiente ? "HECHA" : "PENDIENTE" })}
          disabled={cambiar.isPending}
        >
          {pendiente ? "Marcar como hecha" : <><RotateCcw className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Reabrir</>}
        </Button>
      )}
      {cambiar.isError && (
        <p role="alert" className="w-full text-sm text-destructive">{mensajeError(cambiar.error, "No se pudo cambiar el estado de la acción.")}</p>
      )}
    </li>
  )
}

/** Acciones correctivas del mes, junto al resultado de la meta que las motiva. */
export function AccionesPage() {
  const [params] = useSearchParams()
  const periodo = periodoDe(params)
  const { anio, mes } = periodo
  const esJefe = usePermisos().rol === ROL_JEFE
  const { data, isLoading, isError, error, refetch } = useAcciones(anio, mes)
  const meta = useMetaPeriodo(anio, mes)
  // Pendientes primero; dentro de cada grupo se respeta el orden de registro del backend.
  const acciones = [...(data ?? [])].sort((a, b) => Number(a.estado !== "PENDIENTE") - Number(b.estado !== "PENDIENTE"))
  const pendientes = acciones.filter((a) => a.estado === "PENDIENTE").length
  const hechas = acciones.length - pendientes

  return (
    <div className="flex flex-col gap-6">
      <PageHeader titulo="Acciones correctivas" descripcion={nombreMes(anio, mes)} />
      <NavegacionMes periodo={periodo} />
      <ResultadoMeta meta={meta.data} />
      {isError && <ErrorBanner message="No se pudieron cargar las acciones." error={error} onRetry={() => refetch()} />}
      {esJefe && <FormularioAccion anio={anio} mes={mes} />}
      {isLoading && (
        <div role="status" aria-label="Cargando las acciones" className="flex flex-col gap-3">
          <Skeleton variant="rectangular" className="h-16 w-full" />
          <Skeleton variant="rectangular" className="h-16 w-full" />
        </div>
      )}
      {!isLoading && !isError && acciones.length === 0 && (
        <EstadoVacio
          icono={<ListChecks className="h-6 w-6" />}
          titulo="No hay acciones este mes"
          descripcion={esJefe
            ? "Si el mes no llega a la meta, registra arriba qué se hará para mejorar."
            : "El Jefe Administrativo registra aquí las acciones cuando el mes no llega a la meta."}
        />
      )}
      {!isLoading && !isError && acciones.length > 0 && (
        <section aria-label="Lista de acciones" className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {pendientes} pendiente{pendientes === 1 ? "" : "s"} · {hechas} hecha{hechas === 1 ? "" : "s"}
          </p>
          <ul className="flex flex-col gap-3">
            {acciones.map((accion) => (
              <Fila key={accion.id} accion={accion} esJefe={esJefe} anio={anio} mes={mes} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
