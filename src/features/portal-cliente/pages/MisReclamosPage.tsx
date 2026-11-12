import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { MessageSquareWarning, Plus } from "lucide-react"
import CargandoSpinner from "@/components/ui/CargandoSpinner"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import { mensajeError } from "@/lib/errores"
import { useCrearReclamo, useReclamosPortal } from "../hooks/useReclamosPortal"
import { etiquetaEstadoReclamo, fechaCorta, tonoEstadoReclamo } from "../lib/reclamoPortal"

const MAX_ASUNTO = 200
const MAX_DESCRIPCION = 4000
const campo = "mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

function NuevoReclamo({ onCreado }: { onCreado: (codigo: string) => void }) {
  const crear = useCrearReclamo()
  const [asunto, setAsunto] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [errores, setErrores] = useState<{ asunto?: string; descripcion?: string }>({})

  function enviar(e: FormEvent) {
    e.preventDefault()
    const nuevos = {
      asunto: asunto.trim() ? undefined : "Escribe el asunto",
      descripcion: descripcion.trim() ? undefined : "Cuéntanos qué pasó",
    }
    setErrores(nuevos)
    if (nuevos.asunto || nuevos.descripcion) return
    crear.mutate(
      { asunto: asunto.trim(), descripcion: descripcion.trim() },
      { onSuccess: (r) => onCreado(r.codigoReclamo) },
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Nuevo reclamo</h2>
      <div className="mt-4">
        <label htmlFor="reclamo-asunto" className="text-sm font-medium">Asunto</label>
        <input id="reclamo-asunto" value={asunto} maxLength={MAX_ASUNTO} onChange={(e) => setAsunto(e.target.value)}
          aria-invalid={Boolean(errores.asunto)} aria-describedby={errores.asunto ? "reclamo-asunto-error" : undefined}
          placeholder="Por ejemplo: el filtro llegó dañado" className={campo} />
        {errores.asunto && <p id="reclamo-asunto-error" className="mt-1 text-sm text-destructive">{errores.asunto}</p>}
      </div>
      <div className="mt-4">
        <label htmlFor="reclamo-descripcion" className="text-sm font-medium">¿Qué pasó?</label>
        <textarea id="reclamo-descripcion" value={descripcion} maxLength={MAX_DESCRIPCION} rows={5} onChange={(e) => setDescripcion(e.target.value)}
          aria-invalid={Boolean(errores.descripcion)} aria-describedby={errores.descripcion ? "reclamo-descripcion-error" : undefined}
          placeholder="Cuéntanos qué pedido es, qué pasó y qué necesitas" className={campo} />
        {errores.descripcion && <p id="reclamo-descripcion-error" className="mt-1 text-sm text-destructive">{errores.descripcion}</p>}
      </div>
      {crear.isError && <p role="alert" className="mt-3 text-sm text-destructive">{mensajeError(crear.error, "No pudimos registrar tu reclamo.")}</p>}
      <div className="mt-5 flex justify-end">
        <button type="submit" disabled={crear.isPending} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {crear.isPending ? "Enviando..." : "Enviar reclamo"}
        </button>
      </div>
    </form>
  )
}

export function MisReclamosPage() {
  const query = useReclamosPortal()
  const [formAbierto, setFormAbierto] = useState(false)
  const [creado, setCreado] = useState<string | null>(null)

  if (query.isPending) return <CargandoSpinner texto="Cargando reclamos..." />
  if (query.isError) return <ErrorBanner message="No pudimos cargar tus reclamos." onRetry={() => query.refetch()} />
  const reclamos = query.data ?? []

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reclamos</h1>
          <p className="mt-2 text-muted-foreground">Cuéntanos si algo salió mal con un pedido. Te avisaremos cuando lo resolvamos.</p>
        </div>
        {!formAbierto && (
          <button type="button" onClick={() => { setFormAbierto(true); setCreado(null) }} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Plus className="h-4 w-4" aria-hidden="true" />Nuevo reclamo
          </button>
        )}
      </div>

      {creado && (
        <p role="status" className="mt-6 rounded-md border border-border bg-muted p-4 text-sm">
          Registramos tu reclamo <strong>{creado}</strong>. Te avisaremos cuando tengamos una respuesta.
        </p>
      )}
      {formAbierto && <NuevoReclamo onCreado={(codigo) => { setCreado(codigo); setFormAbierto(false) }} />}

      {reclamos.length === 0 ? (
        !formAbierto && <p className="mt-8 rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">No tienes reclamos registrados.</p>
      ) : (
        <ul className="mt-8 divide-y divide-border rounded-xl border border-border bg-card">
          {reclamos.map((r) => (
            <li key={r.idReclamo}>
              <Link to={`/portal/reclamos/${r.idReclamo}`} className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5">
                <span className="flex items-center gap-3">
                  <MessageSquareWarning className="h-5 w-5 text-accent" aria-hidden="true" />
                  <span>
                    <span className="block font-medium">{r.codigoReclamo}</span>
                    <span className="block text-sm text-muted-foreground">{r.asunto}{r.fechaRegistro ? ` · ${fechaCorta(r.fechaRegistro)}` : ""}</span>
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  {r.puedeCalificar && <span className="text-sm font-medium text-accent">Califica la atención</span>}
                  <EstadoBadge tono={tonoEstadoReclamo(r.estado)}>{etiquetaEstadoReclamo(r.estado)}</EstadoBadge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
