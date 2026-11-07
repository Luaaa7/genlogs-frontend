import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import CargandoSpinner from '@/components/ui/CargandoSpinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { textareaFormClass } from '@/components/ui/campoEstilos'
import { mensajeErrorApi } from '@/api/productosApi'
import { avisar } from '@/lib/avisos'
import { usePermisos } from '@/lib/permisos'
import { cn } from '@/lib/utils/utils'
import { ESTADOS_RECLAMO, PRIORIDADES_RECLAMO, TIPOS_RECLAMO, estadoDe } from '@/lib/formatters/estados'
import { formatearFechaCorta } from '@/lib/formatters/fechaLocal'
import { formatearFechaHora } from '@/lib/formatters/codigoCotizacion'
import type { EstadoReclamo, SeguimientoReclamo } from '@/types/reclamo.types'
import { useComentarReclamo, useEliminarReclamo, useReclamo } from '../hooks/useReclamos'
import { ReclamoFormPanel } from '../components/ReclamoFormPanel'
import { CambiarEstadoReclamoModal } from '../components/CambiarEstadoReclamoModal'

/** Texto del botón de cada transición. */
const ACCION: Record<EstadoReclamo, string> = {
  REGISTRADO: 'Registrar',
  EN_PROCESO: 'Pasar a en proceso',
  RESUELTO: 'Marcar resuelto',
  CERRADO: 'Cerrar',
  ANULADO: 'Anular',
}

export function ReclamoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const idReclamo = Number(id)
  const navigate = useNavigate()
  const { gestionarReclamos, eliminarReclamos } = usePermisos()
  const { data: reclamo, isLoading, isError, refetch } = useReclamo(idReclamo)
  const comentar = useComentarReclamo(idReclamo)
  const eliminar = useEliminarReclamo()

  const [editando, setEditando] = useState(false)
  const [cambiandoA, setCambiandoA] = useState<EstadoReclamo | null>(null)
  const [confirmarBaja, setConfirmarBaja] = useState(false)
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (isLoading) return <div className="flex justify-center py-16"><CargandoSpinner /></div>
  if (isError || !reclamo) {
    return (
      <div className="flex flex-col gap-4">
        <ErrorBanner message="No se pudo cargar el reclamo." onRetry={() => refetch()} />
        <Link to="/reclamos" className="text-sm text-accent hover:underline">Volver a reclamos</Link>
      </div>
    )
  }

  const est = estadoDe(ESTADOS_RECLAMO, reclamo.estado)
  const pri = estadoDe(PRIORIDADES_RECLAMO, reclamo.prioridad)
  const final = reclamo.estado === 'CERRADO' || reclamo.estado === 'ANULADO'
  const siguientes = reclamo.siguientesEstados ?? []

  const enviarComentario = () => {
    const texto = comentario.trim()
    if (!texto) return
    setError(null)
    comentar.mutate(texto, {
      onSuccess: () => setComentario(''),
      onError: (e) => setError(mensajeErrorApi(e, 'No se pudo agregar el comentario.')),
    })
  }

  const darDeBaja = () =>
    eliminar.mutate(idReclamo, {
      onSuccess: () => {
        avisar(`${reclamo.codigoReclamo} eliminado`)
        navigate('/reclamos')
      },
      onError: (e) => {
        setConfirmarBaja(false)
        setError(mensajeErrorApi(e, 'No se pudo eliminar.'))
      },
    })

  return (
    <div className="flex flex-col gap-6">
      <Link to="/reclamos" className="inline-flex w-fit items-center gap-1 rounded text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Reclamos e incidencias
      </Link>

      <PageHeader
        titulo={`${reclamo.codigoReclamo} · ${reclamo.asunto}`}
        descripcion={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span>{TIPOS_RECLAMO[reclamo.tipo] ?? reclamo.tipo}</span>
            <EstadoBadge tono={est.tono}>{est.label}</EstadoBadge>
            <EstadoBadge tono={pri.tono}>Prioridad {pri.label.toLowerCase()}</EstadoBadge>
            {reclamo.vencido && (
              <EstadoBadge tono="destructive"><AlertTriangle className="h-3 w-3" aria-hidden="true" />Vencido</EstadoBadge>
            )}
          </span>
        }
        acciones={gestionarReclamos && (
          <>
            {!final && (
              <Button variant="outline" onClick={() => setEditando(true)}>
                <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Editar
              </Button>
            )}
            {siguientes.map((s) => (
              <Button key={s} variant={s === 'ANULADO' ? 'outline' : 'default'}
                className={cn(s === 'ANULADO' && 'text-destructive')} onClick={() => setCambiandoA(s)}>
                {reclamo.estado === 'RESUELTO' && s === 'EN_PROCESO' ? 'Reabrir' : ACCION[s]}
              </Button>
            ))}
            {eliminarReclamos && (
              <Button variant="ghost" size="icon" aria-label="Eliminar" title="Eliminar" onClick={() => setConfirmarBaja(true)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </>
        )}
      />

      {error && <ErrorBanner message={error} />}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="desc-t" className="rounded-xl border border-border bg-card p-5">
            <h2 id="desc-t" className="mb-2 text-base font-semibold text-foreground">Descripción</h2>
            <p className="whitespace-pre-wrap text-sm text-foreground">{reclamo.descripcion}</p>
            {reclamo.solucion && (
              <div className="mt-4 rounded-lg border border-success/30 bg-success/5 p-3">
                <p className="text-sm font-medium text-success">Solución</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{reclamo.solucion}</p>
              </div>
            )}
          </section>

          <section aria-labelledby="seg-t" className="rounded-xl border border-border bg-card p-5">
            <h2 id="seg-t" className="mb-4 text-base font-semibold text-foreground">Seguimiento</h2>

            {gestionarReclamos && !final && (
              <div className="mb-5 flex flex-col gap-2">
                <label htmlFor="nuevo-comentario" className="sr-only">Nuevo comentario</label>
                <textarea
                  id="nuevo-comentario"
                  rows={3}
                  placeholder="Agrega una nota: llamada al cliente, avance, acuerdo…"
                  className={textareaFormClass}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={enviarComentario} disabled={!comentario.trim() || comentar.isPending}>
                    {comentar.isPending ? 'Guardando…' : 'Agregar comentario'}
                  </Button>
                </div>
              </div>
            )}

            <Bitacora seguimientos={reclamo.seguimientos ?? []} />
          </section>
        </div>

        <aside aria-labelledby="datos-t" className="h-fit rounded-xl border border-border bg-card p-5">
          <h2 id="datos-t" className="mb-3 text-base font-semibold text-foreground">Datos</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
            <Dato termino="Cliente">
              {reclamo.idCliente
                ? <Link to={`/clientes/${reclamo.idCliente}`} className="text-accent hover:underline">{reclamo.cliente}</Link>
                : 'Interno'}
            </Dato>
            <Dato termino="Orden de compra">{reclamo.numeroOrdenCompra ?? '—'}</Dato>
            <Dato termino="Responsable">{reclamo.responsable ?? 'Sin asignar'}</Dato>
            <Dato termino="Registrado">{formatearFechaHora(reclamo.fechaRegistro)}</Dato>
            <Dato termino="Fecha límite">
              <span className={cn(reclamo.vencido && 'font-medium text-destructive')}>{formatearFechaCorta(reclamo.fechaLimite)}</span>
            </Dato>
            {reclamo.fechaCierre && <Dato termino="Cerrado">{formatearFechaHora(reclamo.fechaCierre)}</Dato>}
          </dl>
        </aside>
      </div>

      <ReclamoFormPanel abierto={editando} onCerrar={() => setEditando(false)} reclamo={reclamo} />

      {cambiandoA && (
        <CambiarEstadoReclamoModal reclamo={reclamo} nuevoEstado={cambiandoA} onCerrar={() => setCambiandoA(null)} />
      )}

      <ConfirmDialog
        open={confirmarBaja}
        title={`Eliminar ${reclamo.codigoReclamo}`}
        description="Dejará de aparecer en la lista. Esta acción solo la puede deshacer soporte."
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={eliminar.isPending}
        onConfirm={darDeBaja}
        onCancel={() => setConfirmarBaja(false)}
      />
    </div>
  )
}

function Dato({ termino, children }: { termino: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{termino}</dt>
      <dd className="text-foreground">{children}</dd>
    </>
  )
}

/** Historial del más reciente al más antiguo. */
function Bitacora({ seguimientos }: { seguimientos: SeguimientoReclamo[] }) {
  const ordenados = [...seguimientos].sort(
    (a, b) => new Date(b.fechaEvento).getTime() - new Date(a.fechaEvento).getTime() || b.idSeguimientoReclamo - a.idSeguimientoReclamo,
  )
  if (ordenados.length === 0) return <p className="text-sm text-muted-foreground">Sin movimientos todavía.</p>

  return (
    <ol className="flex flex-col gap-4">
      {ordenados.map((s) => {
        const cambioEstado = s.estadoAnterior !== s.estadoNuevo
        const est = estadoDe(ESTADOS_RECLAMO, s.estadoNuevo)
        return (
          <li key={s.idSeguimientoReclamo} className="border-l-2 border-border pl-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{s.usuario ?? 'Sistema'}</span>
              <span>{formatearFechaHora(s.fechaEvento)}</span>
              {cambioEstado && <EstadoBadge tono={est.tono}>{est.label}</EstadoBadge>}
            </div>
            {s.comentario && <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{s.comentario}</p>}
          </li>
        )
      })}
    </ol>
  )
}
