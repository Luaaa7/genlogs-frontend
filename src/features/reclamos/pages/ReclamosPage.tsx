import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, MessageSquareWarning, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/PageHeader'
import { FiltroChips } from '@/components/ui/FiltroChips'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { EstadoBadge } from '@/components/ui/EstadoBadge'
import { TableSkeletonRows } from '@/components/ui/TableSkeletonRows'
import { Paginacion, Tabla, TablaCard, Td, Th, filaClass } from '@/components/ui/tabla'
import { usePermisos } from '@/lib/permisos'
import { ESTADOS_RECLAMO, PRIORIDADES_RECLAMO, TIPOS_RECLAMO, estadoDe } from '@/lib/formatters/estados'
import { formatearFechaCorta } from '@/lib/formatters/fechaLocal'
import type { EstadoReclamo, TipoReclamo } from '@/types/reclamo.types'
import { useReclamos } from '../hooks/useReclamos'
import { ReclamoFormPanel } from '../components/ReclamoFormPanel'

const OPCIONES_TIPO = [
  { label: 'Todos' },
  ...Object.entries(TIPOS_RECLAMO).map(([valor, label]) => ({ valor: valor as TipoReclamo, label: `${label}s` })),
]

const OPCIONES_ESTADO = [
  { label: 'Todos los estados' },
  ...Object.entries(ESTADOS_RECLAMO).map(([valor, e]) => ({ valor: valor as EstadoReclamo, label: e.label })),
]

export function ReclamosPage() {
  const navigate = useNavigate()
  const { gestionarReclamos } = usePermisos()
  const [tipo, setTipo] = useState<TipoReclamo | undefined>()
  const [estado, setEstado] = useState<EstadoReclamo | undefined>()
  const [pagina, setPagina] = useState(0)
  const [tamano, setTamano] = useState(10)
  const [registrando, setRegistrando] = useState(false)

  const { data, isLoading, isError, error: errorCarga, refetch } = useReclamos({ tipo, estado, page: pagina, size: tamano })
  const reclamos = data?.content ?? []
  const hayFiltro = !!tipo || !!estado

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
        <FiltroChips etiqueta="Filtrar por estado" opciones={OPCIONES_ESTADO} valor={estado} onChange={(v) => { setEstado(v); setPagina(0) }} />
      </div>

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
            descripcion={hayFiltro ? 'Prueba con otro tipo o estado.' : 'Registra el primero cuando un cliente reporte un problema.'}
            accion={!hayFiltro && gestionarReclamos ? <Button onClick={() => setRegistrando(true)}>Registrar</Button> : undefined}
          />
        ) : (
          <Tabla titulo="Reclamos e incidencias" minWidth={860}>
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
                    <tr key={r.idReclamo} className={`${filaClass} cursor-pointer`} onClick={() => navigate(`/reclamos/${r.idReclamo}`)}>
                      <Td className="whitespace-nowrap">
                        <Link
                          to={`/reclamos/${r.idReclamo}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded font-medium tabular-nums text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {r.codigoReclamo}
                        </Link>
                        <div className="text-xs text-muted-foreground">{TIPOS_RECLAMO[r.tipo] ?? r.tipo}</div>
                      </Td>
                      <Td className="max-w-[18rem] truncate" title={r.asunto}>{r.asunto}</Td>
                      <Td>{r.cliente ?? <span className="text-muted-foreground">Interno</span>}</Td>
                      <Td><EstadoBadge tono={pri.tono}>{pri.label}</EstadoBadge></Td>
                      <Td><EstadoBadge tono={est.tono}>{est.label}</EstadoBadge></Td>
                      <Td>{r.responsable ?? <span className="text-muted-foreground">Sin asignar</span>}</Td>
                      <Td className="whitespace-nowrap tabular-nums">{formatearFechaCorta(r.fechaRegistro?.slice(0, 10))}</Td>
                      <Td className="whitespace-nowrap tabular-nums">
                        {r.vencido ? (
                          <span className="inline-flex items-center gap-1 font-medium text-destructive">
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                            {formatearFechaCorta(r.fechaLimite)}
                            <span className="sr-only">(vencido)</span>
                          </span>
                        ) : formatearFechaCorta(r.fechaLimite)}
                      </Td>
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
