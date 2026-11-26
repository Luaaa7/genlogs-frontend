import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, FilterX, MessageSquareWarning, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/PageHeader'
import { FiltroChips } from '@/components/ui/FiltroChips'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { TableSkeletonRows } from '@/components/ui/TableSkeletonRows'
import { AvisoServidorLento } from '@/components/ui/AvisoServidorLento'
import { inputFormClass } from '@/components/ui/campoEstilos'
import { Paginacion, Tabla, TablaCard, Td, Th, filaClass } from '@/components/ui/tabla'
import { usePermisos } from '@/lib/permisos'
import { useTardaMucho } from '@/lib/useTardaMucho'
import { cn } from '@/lib/utils/utils'
import { ESTADOS_RECLAMO, PRIORIDADES_RECLAMO, TIPOS_RECLAMO, estadoDe } from '@/lib/formatters/estados'
import { formatearFechaCorta, hoyISO, parsearFechaLocal } from '@/lib/formatters/fechaLocal'
import type { EstadoReclamo, PrioridadReclamo, Reclamo, TipoReclamo } from '@/types/reclamo.types'
import { useConteosReclamos, useReclamos, useResponsablesReclamo } from '../hooks/useReclamos'
import { ReclamoFormPanel } from '../components/ReclamoFormPanel'

const OPCIONES_TIPO = [
  { label: 'Todos' },
  ...Object.entries(TIPOS_RECLAMO).map(([valor, label]) => ({ valor: valor as TipoReclamo, label: `${label}s` })),
]

const ESTADOS = Object.keys(ESTADOS_RECLAMO) as EstadoReclamo[]
const PRIORIDADES = Object.keys(PRIORIDADES_RECLAMO) as PrioridadReclamo[]
const ESTADOS_CERRADOS: EstadoReclamo[] = ['RESUELTO', 'CERRADO', 'ANULADO']

/** Borde izquierdo de la fila según la prioridad: lo urgente se ve de un vistazo. */
const BORDE_PRIORIDAD: Record<string, string> = {
  CRITICA: 'border-l-destructive',
  ALTA: 'border-l-warning',
  MEDIA: 'border-l-info/60',
  BAJA: 'border-l-border',
}

/** Días entre hoy y la fecha (negativo si ya pasó). */
function diasHasta(fecha: string): number | null {
  const objetivo = parsearFechaLocal(fecha.slice(0, 10))
  const hoy = parsearFechaLocal(hoyISO())
  if (!objetivo || !hoy) return null
  return Math.round((objetivo.getTime() - hoy.getTime()) / 86_400_000)
}

function iniciales(nombre: string): string {
  return nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

/** Fecha límite con lo que falta (o cuánto se pasó). Un reclamo cerrado ya no avisa. */
function Limite({ reclamo }: { reclamo: Reclamo }) {
  if (!reclamo.fechaLimite) return <span className="text-muted-foreground">Sin fecha</span>
  const cerrado = ESTADOS_CERRADOS.includes(reclamo.estado)
  const dias = diasHasta(reclamo.fechaLimite)
  let detalle: string | null = null
  let tono = 'text-muted-foreground'
  if (!cerrado && dias !== null) {
    if (dias < 0) { detalle = `Venció hace ${-dias} día${dias === -1 ? '' : 's'}`; tono = 'text-destructive' }
    else if (dias === 0) { detalle = 'Vence hoy'; tono = 'text-warning-text' }
    else if (dias <= 2) { detalle = `Faltan ${dias} día${dias === 1 ? '' : 's'}`; tono = 'text-warning-text' }
    else detalle = `Faltan ${dias} días`
  }
  const vencido = !cerrado && (reclamo.vencido || (dias !== null && dias < 0))
  return (
    <div className="whitespace-nowrap tabular-nums">
      <span className={cn('inline-flex items-center gap-1', vencido && 'font-medium text-destructive')}>
        {vencido && <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
        {formatearFechaCorta(reclamo.fechaLimite)}
      </span>
      {detalle && <div className={cn('text-xs', tono)}>{detalle}</div>}
    </div>
  )
}

export function ReclamosPage() {
  const navigate = useNavigate()
  const { gestionarReclamos } = usePermisos()
  const [tipo, setTipo] = useState<TipoReclamo | undefined>()
  const [estado, setEstado] = useState<EstadoReclamo | undefined>()
  const [prioridad, setPrioridad] = useState<PrioridadReclamo | undefined>()
  const [idResponsable, setIdResponsable] = useState<number | undefined>()
  const [pagina, setPagina] = useState(0)
  const [tamano, setTamano] = useState(10)
  const [registrando, setRegistrando] = useState(false)

  const { data, isLoading, isError, error: errorCarga, refetch } = useReclamos({
    tipo, estado, prioridad, idResponsable, page: pagina, size: tamano,
  })
  const responsables = useResponsablesReclamo().data ?? []
  const reclamos = data?.content ?? []
  const hayFiltro = !!tipo || !!estado || !!prioridad || idResponsable !== undefined
  const tardaMucho = useTardaMucho(isLoading)
  const conteos = useConteosReclamos(ESTADOS, tipo, { prioridad, idResponsable })
  const opcionesEstado = [
    { label: 'Todos los estados', n: conteos.TODOS },
    ...ESTADOS.map((valor) => ({ valor, label: ESTADOS_RECLAMO[valor].label, n: conteos[valor] })),
  ]

  function limpiar() {
    setTipo(undefined)
    setEstado(undefined)
    setPrioridad(undefined)
    setIdResponsable(undefined)
    setPagina(0)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Reclamos e incidencias"
        descripcion={data
          ? <><span className="tabular-nums">{data.totalElements}</span> registros{hayFiltro ? ' con este filtro' : ''}</>
          : 'Registro y seguimiento de reclamos de clientes e incidencias operativas'}
        acciones={gestionarReclamos && (
          <Button onClick={() => setRegistrando(true)}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Registrar
          </Button>
        )}
      />

      <div className="flex flex-col gap-3">
        <FiltroChips etiqueta="Filtrar por tipo" opciones={OPCIONES_TIPO} valor={tipo} onChange={(v) => { setTipo(v); setPagina(0) }} />
        <FiltroChips etiqueta="Filtrar por estado" opciones={opcionesEstado} valor={estado} onChange={(v) => { setEstado(v); setPagina(0) }} />
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Prioridad
            <select
              className={cn(inputFormClass, 'h-9 w-40')}
              value={prioridad ?? ''}
              onChange={(e) => { setPrioridad((e.target.value || undefined) as PrioridadReclamo | undefined); setPagina(0) }}
            >
              <option value="">Todas</option>
              {PRIORIDADES.map((p) => <option key={p} value={p}>{PRIORIDADES_RECLAMO[p].label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Responsable
            <select
              className={cn(inputFormClass, 'h-9 w-56')}
              value={idResponsable ?? ''}
              onChange={(e) => { setIdResponsable(e.target.value ? Number(e.target.value) : undefined); setPagina(0) }}
            >
              <option value="">Todos</option>
              {responsables.map((u) => <option key={u.idUsuario} value={u.idUsuario}>{u.nombres}</option>)}
            </select>
          </label>
          {hayFiltro && (
            <Button variant="ghost" size="sm" onClick={limpiar}>
              <FilterX className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {tardaMucho && <AvisoServidorLento />}
      {isError && <ErrorBanner message="No se pudieron cargar los reclamos." error={errorCarga} onRetry={() => refetch()} />}

      <TablaCard
        pie={data && (
          <Paginacion
            pagina={pagina}
            totalPaginas={data.totalPages}
            total={data.totalElements}
            enPagina={reclamos.length}
            tamano={tamano}
            onPagina={setPagina}
            onTamano={(t) => { setTamano(t); setPagina(0) }}
          />
        )}
      >
        {!isLoading && !isError && reclamos.length === 0 ? (
          <EstadoVacio
            icono={<MessageSquareWarning className="h-5.5 w-5.5" />}
            titulo={hayFiltro ? 'No hay registros con este filtro' : 'Aún no hay reclamos ni incidencias'}
            descripcion={hayFiltro ? 'Prueba con otro filtro o límpialos.' : 'Registra el primero cuando un cliente reporte un problema.'}
            accion={hayFiltro
              ? <Button variant="outline" onClick={limpiar}>Limpiar filtros</Button>
              : gestionarReclamos ? <Button onClick={() => setRegistrando(true)}>Registrar</Button> : undefined}
          />
        ) : (
          <Tabla titulo="Reclamos e incidencias" minWidth={960}>
            <thead>
              <tr>
                <Th>Código</Th>
                <Th>Asunto</Th>
                <Th>Cliente</Th>
                <Th>Prioridad</Th>
                <Th>Estado</Th>
                <Th>Responsable</Th>
                <Th>Registrado</Th>
                <Th>Límite</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeletonRows columns={8} />
              ) : (
                reclamos.map((r) => {
                  const est = estadoDe(ESTADOS_RECLAMO, r.estado)
                  const pri = estadoDe(PRIORIDADES_RECLAMO, r.prioridad)
                  return (
                    <tr key={r.idReclamo} className={`${filaClass} cursor-pointer align-top`} onClick={() => navigate(`/reclamos/${r.idReclamo}`)}>
                      <Td className={cn('whitespace-nowrap border-l-4', BORDE_PRIORIDAD[r.prioridad] ?? 'border-l-border')}>
                        <Link
                          to={`/reclamos/${r.idReclamo}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded font-medium tabular-nums text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {r.codigoReclamo}
                        </Link>
                        <div className="text-xs text-muted-foreground">{TIPOS_RECLAMO[r.tipo] ?? r.tipo}</div>
                      </Td>
                      <Td className="max-w-[20rem]">
                        <div className="truncate font-medium text-foreground" title={r.asunto}>{r.asunto}</div>
                        {r.descripcion && (
                          <div className="line-clamp-1 text-xs text-muted-foreground" title={r.descripcion}>{r.descripcion}</div>
                        )}
                      </Td>
                      <Td className="max-w-[14rem]">
                        {r.cliente
                          ? <div className="truncate" title={r.cliente}>{r.cliente}</div>
                          : <span className="text-muted-foreground">Interno</span>}
                        {r.numeroOrdenCompra && <div className="text-xs tabular-nums text-muted-foreground">OC {r.numeroOrdenCompra}</div>}
                      </Td>
                      <Td><EstadoBadge tono={pri.tono}>{pri.label}</EstadoBadge></Td>
                      <Td><EstadoBadge tono={est.tono}>{est.label}</EstadoBadge></Td>
                      <Td>
                        {r.responsable ? (
                          <span className="flex items-center gap-2">
                            <span aria-hidden="true"
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {iniciales(r.responsable)}
                            </span>
                            <span className="max-w-[9rem] truncate" title={r.responsable}>{r.responsable}</span>
                          </span>
                        ) : <span className="text-muted-foreground">Sin asignar</span>}
                      </Td>
                      <Td className="whitespace-nowrap tabular-nums">{formatearFechaCorta(r.fechaRegistro?.slice(0, 10))}</Td>
                      <Td><Limite reclamo={r} /></Td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </Tabla>
        )}
      </TablaCard>

      <ReclamoFormPanel
        abierto={registrando}
        onCerrar={() => setRegistrando(false)}
        onGuardado={(r) => navigate(`/reclamos/${r.idReclamo}`)}
      />
    </div>
  )
}
