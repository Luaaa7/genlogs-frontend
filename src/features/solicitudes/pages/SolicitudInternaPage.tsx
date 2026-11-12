import { useState } from 'react'
import { Inbox } from 'lucide-react'
import { useLocation, useParams } from 'react-router-dom'
import type { EstadoSolicitud, TipoPlazo } from '@/api/contratos'
import type { SolicitudInternaResponse } from '@/api/contratos/solicitudes'
import { ErrorBanner } from '@/components/ui/ErrorBanner'
import { EstadoBadge, type EstadoBadgeTono } from '@/components/ui/EstadoBadge'
import { EstadoVacio } from '@/components/ui/EstadoVacio'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatearFechaHora } from '@/lib/formatters/codigoCotizacion'
import { formatearFechaCorta } from '@/lib/formatters/fechaLocal'
import { mensajeError } from '@/lib/errores'
import { usePermisos } from '@/lib/permisos'
import { solicitudDeRuta } from '../api/solicitudesInternasApi'
import { AccionesSolicitud } from '../components/AccionesSolicitud'
import { HistorialSolicitud } from '../components/HistorialSolicitud'
import { useAsignables } from '../hooks/useAsignables'
import { useAccionesSolicitud, useHistorialSolicitud } from '../hooks/useSolicitudInterna'
import { puedeActuar, ROL_JEFE } from '../lib/reglasSolicitud'

const ESTADO: Record<EstadoSolicitud, { label: string; tono: EstadoBadgeTono }> = {
  PENDIENTE: { label: 'Pendiente', tono: 'warning' },
  EN_REVISION: { label: 'En revisión', tono: 'info' },
  EN_ESPERA_TERCERO: { label: 'En espera de tercero', tono: 'accent' },
  COTIZADA: { label: 'Cotizada', tono: 'success' },
  RECHAZADA: { label: 'Rechazada', tono: 'destructive' },
  CANCELADA: { label: 'Cancelada', tono: 'neutral' },
}
const PLAZO: Record<TipoPlazo, string> = { COMUN: 'Común', IMPORTADO: 'Importado', ESPECIAL: 'Especial' }

export function SolicitudInternaPage() {
  const { id } = useParams()
  return <Detalle key={id} />
}

function Detalle() {
  const { id: raw } = useParams()
  const id = Number(raw)
  const location = useLocation()
  const fila = (location.state as { solicitud?: SolicitudInternaResponse } | null)?.solicitud ?? null
  const [solicitud, setSolicitud] = useState(() => solicitudDeRuta(id, fila))
  const { rol } = usePermisos()
  const actuar = puedeActuar(rol)
  const esJefe = rol === ROL_JEFE
  const acciones = useAccionesSolicitud(id, setSolicitud)
  const historial = useHistorialSolicitud(id, solicitud !== null)
  const asignables = useAsignables(esJefe && solicitud !== null)
  const errorAccion = acciones.iniciar.error ?? acciones.pausar.error ?? acciones.reanudar.error ?? acciones.reclasificar.error ?? acciones.reasignar.error
  const ocupado = acciones.iniciar.isPending || acciones.pausar.isPending || acciones.reanudar.isPending || acciones.reclasificar.isPending || acciones.reasignar.isPending

  if (!solicitud) {
    return <EstadoVacio icono={<Inbox className="h-6 w-6" />} titulo="Abre la solicitud desde la lista" />
  }

  const estado = ESTADO[solicitud.estado]
  return (
    <div className="flex flex-col gap-6">
      <PageHeader titulo={solicitud.codigoSolicitud} descripcion={solicitud.asunto} />
      <div className="flex flex-wrap items-center gap-2">
        <EstadoBadge tono={estado.tono}>{estado.label}</EstadoBadge>
        {solicitud.pausadaDesde != null && <EstadoBadge tono="warning">Pausada</EstadoBadge>}
      </div>
      {errorAccion && <ErrorBanner message={mensajeError(errorAccion)} />}
      <dl className="grid gap-2 rounded-xl border border-border bg-card p-5 text-sm sm:grid-cols-2">
        <Dato titulo="Cliente" valor={solicitud.cliente} />
        <Dato titulo="Plazo" valor={PLAZO[solicitud.tipoPlazo]} />
        <Dato titulo="Recepción" valor={formatearFechaHora(solicitud.fechaRecepcion)} />
        <Dato titulo="Límite interno" valor={formatearFechaCorta(solicitud.fechaLimiteInterna)} />
        <Dato titulo="Reclasificaciones" valor={String(solicitud.reclasificaciones)} />
        <Dato titulo="Asignado" valor={solicitud.asignado?.nombres ?? 'Sin asignar'} />
        {solicitud.estado === 'EN_ESPERA_TERCERO' && (
          <>
            <Dato titulo="Motivo de la pausa" valor={solicitud.motivoPausa ?? '—'} />
            <Dato titulo="Fecha estimada del tercero" valor={formatearFechaCorta(solicitud.fechaEstimadaTercero)} />
          </>
        )}
      </dl>
      <AccionesSolicitud
        solicitud={solicitud}
        puedeActuar={actuar}
        esJefe={esJefe}
        ocupado={ocupado}
        usuarios={asignables.usuarios}
        errorUsuarios={asignables.error}
        cargandoUsuarios={asignables.cargando}
        onIniciar={() => acciones.iniciar.mutate()}
        onPausar={(body) => acciones.pausar.mutate(body)}
        onReanudar={() => acciones.reanudar.mutate()}
        onReclasificar={(tipo) => acciones.reclasificar.mutate(tipo)}
        onReasignar={(idUsuario) => acciones.reasignar.mutate(idUsuario)}
      />
      {historial.isError && <ErrorBanner message="No se pudo cargar el historial." error={historial.error} />}
      {historial.data && <HistorialSolicitud eventos={historial.data} />}
    </div>
  )
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{titulo}</dt>
      <dd className="font-medium text-foreground">{valor}</dd>
    </div>
  )
}
