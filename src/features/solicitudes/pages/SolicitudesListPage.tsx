import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Inbox } from 'lucide-react'
import { ESTADOS_SOLICITUD, TIPOS_PLAZO, type EstadoSolicitud, type TipoPlazo } from '@/api/contratos'
import type { FiltrosSolicitudes, SolicitudInternaFila } from '@/api/contratos/solicitudes'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { EstadoBadge, type EstadoBadgeTono } from '@/components/ui/EstadoBadge'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { FiltroChips } from '@/components/ui/FiltroChips'
import { PageHeader } from '@/components/ui/PageHeader'
import { Paginacion, Tabla, TablaCard, Td, Th, controlClass, filaClass } from '@/components/ui/tabla'
import { formatearFechaCorta } from '@/lib/formatters/fechaLocal'
import { useAsignables } from '../hooks/useAsignables'
import { useSolicitudesInternas } from '../hooks/useSolicitudesInternas'

const ESTADO: Record<EstadoSolicitud, { label: string; tono: EstadoBadgeTono }> = {
  PENDIENTE: { label: 'Pendiente', tono: 'warning' },
  EN_REVISION: { label: 'En revisión', tono: 'info' },
  EN_ESPERA_TERCERO: { label: 'En espera de tercero', tono: 'accent' },
  COTIZADA: { label: 'Cotizada', tono: 'success' },
  RECHAZADA: { label: 'Rechazada', tono: 'destructive' },
  CANCELADA: { label: 'Cancelada', tono: 'neutral' },
}
const PLAZO: Record<TipoPlazo, string> = { COMUN: 'Común', IMPORTADO: 'Importado', ESPECIAL: 'Especial' }
const COLOR_SEMAFORO = { VERDE: 'bg-success', AMARILLO: 'bg-warning', ROJO: 'bg-destructive' } as const
const NOMBRE_SEMAFORO = { VERDE: 'Semáforo verde', AMARILLO: 'Semáforo ámbar', ROJO: 'Semáforo rojo' } as const

export function SolicitudesListPage() {
  const [filtros, setFiltros] = useState<FiltrosSolicitudes>({ page: 0, size: 10 })
  const { data, isLoading, isError, error, refetch } = useSolicitudesInternas(filtros)
  const { usuarios } = useAsignables(true)
  const filas = data?.content ?? []

  const cambiar = (parcial: Partial<FiltrosSolicitudes>) => {
    setFiltros((prev) => ({ ...prev, ...parcial, page: parcial.page ?? 0 }))
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader titulo="Solicitudes" descripcion="Ordenadas por vencimiento" />
      <FiltroChips
        etiqueta="Filtrar por estado"
        valor={filtros.estado}
        onChange={(estado) => cambiar({ estado })}
        opciones={[{ label: 'Todas' }, ...ESTADOS_SOLICITUD.map((estado) => ({ valor: estado, label: ESTADO[estado].label }))]}
      />
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm" htmlFor="sol-buscar">
          Buscar
          <input id="sol-buscar" value={filtros.q ?? ''} onChange={(e) => cambiar({ q: e.target.value.trim() || undefined })} className={controlClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm" htmlFor="sol-plazo">
          Plazo
          <select id="sol-plazo" className={controlClass} value={filtros.tipoPlazo ?? ''} onChange={(e) => cambiar({ tipoPlazo: (e.target.value || undefined) as TipoPlazo | undefined })}>
            <option value="">Todos</option>
            {TIPOS_PLAZO.map((plazo) => <option key={plazo} value={plazo}>{PLAZO[plazo]}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm" htmlFor="sol-asistente">
          Asistente
          <select id="sol-asistente" className={controlClass} value={filtros.idAsistente ?? ''} onChange={(e) => cambiar({ idAsistente: e.target.value ? Number(e.target.value) : undefined })}>
            <option value="">Todos</option>
            {usuarios.map((usuario) => <option key={usuario.idUsuario} value={usuario.idUsuario}>{usuario.nombres}</option>)}
          </select>
        </label>
      </div>
      {isError && <ErrorBanner message="No se pudieron cargar las solicitudes." error={error} onRetry={() => refetch()} />}
      {isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">Cargando solicitudes…</p>
      ) : !isError && filas.length === 0 ? (
        <EstadoVacio icono={<Inbox className="h-5 w-5" />} titulo="No hay solicitudes" descripcion="Prueba con otros filtros." />
      ) : (
        <TablaCard pie={data && (
          <Paginacion
            pagina={filtros.page}
            totalPaginas={data.totalPages}
            total={data.totalElements}
            enPagina={filas.length}
            tamano={filtros.size}
            onPagina={(page) => cambiar({ page })}
            onTamano={(size) => cambiar({ size })}
          />
        )}>
          <Tabla titulo="Solicitudes internas">
            <thead>
              <tr>
                <Th>Código</Th>
                <Th>Asunto</Th>
                <Th>Estado</Th>
                <Th>Plazo</Th>
                <Th>Vence</Th>
                <Th>Asignada</Th>
                <Th><span className="sr-only">Semáforo</span></Th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => <Fila key={fila.idSolicitud} fila={fila} />)}
            </tbody>
          </Tabla>
        </TablaCard>
      )}
    </div>
  )
}

function Fila({ fila }: { fila: SolicitudInternaFila }) {
  const color = fila.semaforo ? COLOR_SEMAFORO[fila.semaforo] : null
  return (
    <tr className={filaClass}>
      <Td className="whitespace-nowrap font-medium">
        <Link to={`/solicitudes/${fila.idSolicitud}`} state={{ solicitud: fila }} className="rounded text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {fila.codigoSolicitud}
        </Link>
      </Td>
      <Td>{fila.asunto}</Td>
      <Td><EstadoBadge tono={ESTADO[fila.estado].tono}>{ESTADO[fila.estado].label}</EstadoBadge></Td>
      <Td>{PLAZO[fila.tipoPlazo]}</Td>
      <Td className="whitespace-nowrap tabular-nums">{formatearFechaCorta(fila.fechaLimiteInterna)}</Td>
      <Td>{fila.asignado?.nombres ?? '—'}</Td>
      <Td>
        {color && fila.semaforo && <span role="img" aria-label={NOMBRE_SEMAFORO[fila.semaforo]} className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />}
      </Td>
    </tr>
  )
}
