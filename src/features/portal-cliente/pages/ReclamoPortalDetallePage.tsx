import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Star } from "lucide-react"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import { mensajeError } from "@/lib/errores"
import { useCalificarReclamo, useReclamoPortal } from "../hooks/useReclamosPortal"
import { etiquetaEstadoReclamo, fechaCorta, tonoEstadoReclamo } from "../lib/reclamoPortal"

const MAX_COMENTARIO = 1000

function Calificar({ id }: { id: number }) {
  const calificar = useCalificarReclamo(id)
  const [puntaje, setPuntaje] = useState(0)
  const [comentario, setComentario] = useState("")

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h2 className="text-lg font-semibold">¿Cómo te atendimos?</h2>
      <div role="radiogroup" aria-label="Calificación de 1 a 5" className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={puntaje === n} aria-label={`${n} de 5`} onClick={() => setPuntaje(n)}
            className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Star className={`h-7 w-7 ${n <= puntaje ? "fill-accent text-accent" : "text-muted-foreground"}`} aria-hidden="true" />
          </button>
        ))}
      </div>
      <label htmlFor="reclamo-comentario" className="mt-4 block text-sm font-medium">Comentario (opcional)</label>
      <textarea id="reclamo-comentario" value={comentario} maxLength={MAX_COMENTARIO} rows={3} onChange={(e) => setComentario(e.target.value)}
        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      {calificar.isError && <p role="alert" className="mt-2 text-sm text-destructive">{mensajeError(calificar.error, "No pudimos guardar tu calificación.")}</p>}
      <div className="mt-4 flex justify-end">
        <button type="button" disabled={puntaje === 0 || calificar.isPending}
          onClick={() => calificar.mutate({ puntaje, comentario: comentario.trim() || undefined })}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {calificar.isPending ? "Enviando..." : "Enviar calificación"}
        </button>
      </div>
    </div>
  )
}

export function ReclamoPortalDetallePage() {
  const { id } = useParams()
  const idNumero = Number(id)
  const query = useReclamoPortal(idNumero)

  if (query.isPending) return <CargandoSpinner texto="Cargando reclamo..." />
  if (query.isError || !query.data) return <ErrorBanner message="No pudimos cargar el reclamo." onRetry={() => query.refetch()} />
  const r = query.data

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/portal/reclamos" className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
        <ArrowLeft className="h-4 w-4" /> Volver a mis reclamos
      </Link>
      <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Reclamo {r.codigoReclamo}</p>
            <h1 className="mt-1 text-2xl font-bold">{r.asunto}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Registrado el {fechaCorta(r.fechaRegistro)}{r.numeroOrdenCompra ? ` · OC ${r.numeroOrdenCompra}` : ""}
            </p>
          </div>
          <EstadoBadge tono={tonoEstadoReclamo(r.estado)}>{etiquetaEstadoReclamo(r.estado)}</EstadoBadge>
        </div>

        {r.descripcion && <p className="mt-6 whitespace-pre-line">{r.descripcion}</p>}

        {r.solucion && (
          <div className="mt-6 rounded-md bg-muted p-4">
            <p className="text-sm font-medium">Respuesta de GENLOGS</p>
            <p className="mt-1 whitespace-pre-line">{r.solucion}</p>
          </div>
        )}

        {r.historial && r.historial.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium">Seguimiento</p>
            <ol className="mt-2 space-y-1 text-sm">
              {r.historial.map((e, i) => (
                <li key={i} className="flex justify-between gap-4 border-b border-border py-1 last:border-0">
                  <span>{etiquetaEstadoReclamo(e.estado)}</span>
                  <span className="text-muted-foreground">{fechaCorta(e.fecha)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {r.calificacion != null && (
          <div className="mt-8 border-t border-border pt-6">
            <p className="font-medium">Tu calificación: {r.calificacion} de 5</p>
            {r.comentarioCalificacion && <p className="mt-1 text-muted-foreground">{r.comentarioCalificacion}</p>}
          </div>
        )}
        {r.puedeCalificar && r.calificacion == null && <Calificar id={r.idReclamo} />}
      </div>
    </div>
  )
}
