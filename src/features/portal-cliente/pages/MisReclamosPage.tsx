import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { CalendarCheck, CalendarDays, ChevronRight, Clock, FileText, MessageSquareWarning, Plus, Star, X } from "lucide-react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { EstadoBadge } from "@/components/ui/EstadoBadge"
import { mensajeError } from "@/lib/errores"
import { BotonNuevaSolicitud } from "../components/BotonNuevaSolicitud"
import { EncabezadoPortal } from "../components/EncabezadoPortal"
import { EstadoVacioIlustrado } from "../components/EstadoVacioIlustrado"
import { LineaEtapas } from "../components/LineaEtapas"
import { ListaEsqueleto } from "../components/SkeletonCard"
import { useCrearReclamo, useReclamosPortal } from "../hooks/useReclamosPortal"
import { BOTON_SECUNDARIO, ENTRADA_TARJETA, ICONO_TARJETA, TARJETA_ELEVABLE, TARJETA_PORTAL, retardoEntrada } from "../lib/estilosTarjeta"
import { ETAPAS_RECLAMO, etapaDelReclamo, etiquetaEstadoReclamo, fechaCorta, tonoEstadoReclamo } from "../lib/reclamoPortal"

const MAX_ASUNTO = 200
const MAX_DESCRIPCION = 4000
const campo = "mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:border-[#2E6BA8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:bg-[#0B1830]"
const BOTON_AZUL = "inline-flex items-center justify-center gap-2 rounded-lg bg-[#2E6BA8] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#2E6BA8]/30 hover:bg-[#1E5A94] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-[#2563EB] dark:hover:bg-[#1D4ED8]"

function NuevoReclamo({ onCreado, onCancelar }: { onCreado: (codigo: string) => void; onCancelar: () => void }) {
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
    <form onSubmit={enviar} noValidate className="animate-[tarjeta-entra_0.35s_ease-out_backwards] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm motion-reduce:animate-none dark:border-white/10 dark:bg-[#0F213D] sm:p-6">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className={ICONO_TARJETA}><MessageSquareWarning className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-[#183153] dark:text-slate-50">Nuevo reclamo</h2>
          <p className="text-sm text-muted-foreground">Indica el pedido o la orden y qué necesitas que resolvamos.</p>
        </div>
        <button type="button" onClick={onCancelar} aria-label="Cerrar el formulario" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
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
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancelar} className={`${BOTON_SECUNDARIO} justify-center py-2.5`}>Cancelar</button>
        <button type="submit" disabled={crear.isPending} className={BOTON_AZUL}>
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
  const reclamos = query.data ?? []
  const abiertos = reclamos.filter((r) => r.estado === "REGISTRADO" || r.estado === "EN_PROCESO").length
  const porCalificar = reclamos.filter((r) => r.puedeCalificar).length

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPortal
        titulo="Reclamos"
        descripcion="Cuéntanos si algo salió mal con un pedido. Te avisaremos cuando lo resolvamos."
        ilustracion="reclamos"
        resumen={reclamos.length > 0 ? [
          { icono: <MessageSquareWarning />, valor: reclamos.length, texto: reclamos.length === 1 ? "reclamo" : "reclamos" },
          { icono: <Clock />, valor: abiertos, texto: "en atención" },
          { icono: <Star />, valor: porCalificar, texto: "por calificar" },
        ] : undefined}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {!formAbierto ? (
          <button type="button" onClick={() => { setFormAbierto(true); setCreado(null) }} className={BOTON_AZUL}>
            <Plus className="h-4 w-4" aria-hidden="true" />Nuevo reclamo
          </button>
        ) : <span />}
        <BotonNuevaSolicitud />
      </div>

      {creado && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
          Registramos tu reclamo <strong>{creado}</strong>. Te avisaremos cuando tengamos una respuesta.
        </p>
      )}
      {formAbierto && <NuevoReclamo onCreado={(codigo) => { setCreado(codigo); setFormAbierto(false) }} onCancelar={() => setFormAbierto(false)} />}

      {query.isPending ? (
        <ListaEsqueleto variante="pedido" etiqueta="Cargando reclamos..." />
      ) : query.isError ? (
        <ErrorBanner message="No pudimos cargar tus reclamos." onRetry={() => query.refetch()} />
      ) : reclamos.length === 0 ? (
        !formAbierto && (
          <EstadoVacioIlustrado
            ilustracion="reclamos"
            titulo="No tienes reclamos registrados."
            descripcion="Si tienes algún inconveniente con un pedido, crea un nuevo reclamo."
          />
        )
      ) : (
        <ul className="grid gap-4">
          {reclamos.map((r, indice) => {
            const etapa = etapaDelReclamo(r.estado)
            return (
              <li key={r.idReclamo} style={retardoEntrada(indice)} className={`group ${TARJETA_PORTAL} ${TARJETA_ELEVABLE} ${ENTRADA_TARJETA}`}>
                <Link to={`/portal/reclamos/${r.idReclamo}`} className="block rounded-xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6">
                  <span className="flex items-start gap-3 sm:gap-4">
                    <span aria-hidden="true" className={ICONO_TARJETA}><MessageSquareWarning className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            <span className="tabular-nums">{r.codigoReclamo}</span>
                          </span>
                          <span className="mt-0.5 block text-base font-semibold leading-snug text-[#183153] dark:text-slate-50 sm:text-lg">{r.asunto}</span>
                        </span>
                        <span className="flex flex-wrap items-center gap-2">
                          {r.puedeCalificar && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FACC15]/20 px-2.5 py-0.5 text-xs font-semibold text-[#854D0E] dark:bg-[#FACC15]/15 dark:text-[#FDE68A]">
                              <Star className="h-3.5 w-3.5" aria-hidden="true" />Califica la atención
                            </span>
                          )}
                          <EstadoBadge tono={tonoEstadoReclamo(r.estado)}>{etiquetaEstadoReclamo(r.estado)}</EstadoBadge>
                        </span>
                      </span>
                      {r.descripcion && <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{r.descripcion}</span>}
                    </span>
                  </span>

                  {etapa >= 0 && (
                    <LineaEtapas
                      etapas={ETAPAS_RECLAMO.map(etiquetaEstadoReclamo)}
                      actual={etapa}
                      terminado={r.estado === "CERRADO"}
                      IconoEnCurso={Clock}
                      resumen={`Etapa ${etapa + 1} de ${ETAPAS_RECLAMO.length}: ${etiquetaEstadoReclamo(r.estado)}`}
                      className="mt-5"
                    />
                  )}

                  <span className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-sm dark:border-white/10">
                    {r.fechaRegistro && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EEF3F8] px-2.5 py-1 text-[#183153] dark:bg-white/[0.04] dark:text-slate-200">
                        <CalendarDays className="h-4 w-4 text-[#2E6BA8] dark:text-[#60A5FA]" aria-hidden="true" />Registrado el {fechaCorta(r.fechaRegistro)}
                      </span>
                    )}
                    {r.numeroOrdenCompra && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EEF3F8] px-2.5 py-1 text-[#183153] dark:bg-white/[0.04] dark:text-slate-200">
                        <FileText className="h-4 w-4 text-[#2E6BA8] dark:text-[#60A5FA]" aria-hidden="true" />Orden {r.numeroOrdenCompra}
                      </span>
                    )}
                    {r.fechaCierre && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#EEF3F8] px-2.5 py-1 text-[#183153] dark:bg-white/[0.04] dark:text-slate-200">
                        <CalendarCheck className="h-4 w-4 text-[#2E6BA8] dark:text-[#60A5FA]" aria-hidden="true" />Cerrado el {fechaCorta(r.fechaCierre)}
                      </span>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1 font-semibold text-[#2E6BA8] dark:text-[#93C5FD]">
                      Ver detalle<ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
