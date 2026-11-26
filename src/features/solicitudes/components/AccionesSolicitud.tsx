import { useState } from 'react'
import { TIPOS_PLAZO, type TipoPlazo } from '@/api/contratos'
import type { PausarSolicitudRequest, SolicitudInternaResponse, UsuarioResumen } from '@/api/contratos/solicitudes'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { inputFormClass } from '@/components/ui/campoEstilos'
import { fechaEstimadaValida, MOTIVO_ESPERA_PROVEEDOR } from '../lib/reglasSolicitud'

const TERMINALES = new Set<SolicitudInternaResponse['estado']>(['COTIZADA', 'RECHAZADA', 'CANCELADA'])
const PLAZO: Record<TipoPlazo, string> = { COMUN: 'Común', IMPORTADO: 'Importado', ESPECIAL: 'Especial' }
const TEXTO_SEGUNDA = 'La segunda reclasificación la aprueba el Jefe Administrativo'

interface Props {
  solicitud: SolicitudInternaResponse
  puedeActuar: boolean
  esJefe: boolean
  ocupado: boolean
  usuarios: UsuarioResumen[]
  errorUsuarios: string | null
  cargandoUsuarios: boolean
  onIniciar: () => void
  onPausar: (body: PausarSolicitudRequest) => void
  onReanudar: () => void
  onReclasificar: (tipo: TipoPlazo) => void
  onReasignar: (idUsuario: number) => void
}

export function AccionesSolicitud({
  solicitud, puedeActuar, esJefe, ocupado, usuarios, errorUsuarios, cargandoUsuarios,
  onIniciar, onPausar, onReanudar, onReclasificar, onReasignar,
}: Props) {
  const [pausaAbierta, setPausaAbierta] = useState(false)
  const [fecha, setFecha] = useState('')
  const [errorFecha, setErrorFecha] = useState<string | null>(null)
  const [plazo, setPlazo] = useState<TipoPlazo>(solicitud.tipoPlazo)
  const [confirmarPlazo, setConfirmarPlazo] = useState(false)
  const [usuarioId, setUsuarioId] = useState(usuarios[0] ? String(usuarios[0].idUsuario) : '')
  const [confirmarUsuario, setConfirmarUsuario] = useState(false)

  if (TERMINALES.has(solicitud.estado) || !puedeActuar) return null

  const segundaBloqueada = solicitud.reclasificaciones >= 1 && !esJefe

  /** Proveedor contactado: la solicitud pasa a esperar su respuesta (siempre con el mismo motivo). */
  function confirmarContacto() {
    if (!fechaEstimadaValida(fecha)) {
      setErrorFecha('La fecha estimada no puede ser pasada.')
      return
    }
    onPausar({ motivo: MOTIVO_ESPERA_PROVEEDOR, ...(fecha.trim() ? { fechaEstimada: fecha.trim() } : {}) })
    setPausaAbierta(false)
    setErrorFecha(null)
  }

  return (
    <section aria-label="Acciones" className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      {puedeActuar && solicitud.estado === 'PENDIENTE' && (
        <Button type="button" onClick={onIniciar} disabled={ocupado}>Empezar a buscar el producto</Button>
      )}
      {puedeActuar && solicitud.estado === 'EN_REVISION' && (
        <div className="flex flex-col items-start gap-2">
          <Button type="button" variant="outline" onClick={() => setPausaAbierta((v) => !v)} disabled={ocupado}>Proveedor contactado</Button>
          {pausaAbierta && (
            <div role="group" aria-label="Proveedor contactado" className="flex w-full max-w-sm flex-col gap-2 rounded-lg border border-border p-3">
              <label className="text-sm text-foreground" htmlFor="pausa-fecha">Fecha estimada de respuesta
                <input id="pausa-fecha" type="date" className={`${inputFormClass} mt-1`} value={fecha} onChange={(e) => { setFecha(e.target.value); setErrorFecha(null) }} />
              </label>
              {errorFecha && <p role="alert" className="text-sm text-destructive">{errorFecha}</p>}
              <Button type="button" onClick={confirmarContacto} disabled={ocupado}>Confirmar</Button>
            </div>
          )}
        </div>
      )}
      {puedeActuar && solicitud.estado === 'EN_ESPERA_TERCERO' && (
        <Button type="button" onClick={onReanudar} disabled={ocupado}>Proveedor respondió</Button>
      )}
      {puedeActuar && solicitud.estado !== 'PENDIENTE' && (
        <div className="flex flex-col items-start gap-2">
          <label className="text-sm text-foreground" htmlFor="plazo-solicitud">Tipo de plazo
            <select id="plazo-solicitud" className={`${inputFormClass} mt-1`} value={plazo} disabled={segundaBloqueada || ocupado} onChange={(e) => setPlazo(e.target.value as TipoPlazo)}>
              {TIPOS_PLAZO.map((tipo) => <option key={tipo} value={tipo}>{PLAZO[tipo]}</option>)}
            </select>
          </label>
          <Button type="button" variant="outline" disabled={segundaBloqueada || ocupado} onClick={() => setConfirmarPlazo(true)}>Reclasificar</Button>
          {segundaBloqueada && <p className="text-sm text-muted-foreground">{TEXTO_SEGUNDA}</p>}
        </div>
      )}
      {esJefe && (
        <div className="flex flex-col items-start gap-2">
          <label className="text-sm text-foreground" htmlFor="asignar-usuario">Reasignar a
            <select id="asignar-usuario" className={`${inputFormClass} mt-1`} value={usuarioId} disabled={ocupado || cargandoUsuarios || usuarios.length === 0} onChange={(e) => setUsuarioId(e.target.value)}>
              {usuarios.map((u) => <option key={u.idUsuario} value={u.idUsuario}>{u.nombres}</option>)}
            </select>
          </label>
          {errorUsuarios && <p role="alert" className="text-sm text-destructive">{errorUsuarios}</p>}
          <Button type="button" variant="outline" disabled={ocupado || !usuarioId} onClick={() => setConfirmarUsuario(true)}>Reasignar</Button>
        </div>
      )}
      <ConfirmDialog
        open={confirmarPlazo}
        title="Reclasificar plazo"
        description={`El plazo pasará a ${PLAZO[plazo]}.`}
        confirmLabel="Confirmar"
        variant="default"
        isLoading={ocupado}
        onCancel={() => setConfirmarPlazo(false)}
        onConfirm={() => { setConfirmarPlazo(false); onReclasificar(plazo) }}
      />
      <ConfirmDialog
        open={confirmarUsuario}
        title="Reasignar solicitud"
        description="La solicitud quedará a cargo de la persona elegida."
        confirmLabel="Confirmar"
        variant="default"
        isLoading={ocupado}
        onCancel={() => setConfirmarUsuario(false)}
        onConfirm={() => { setConfirmarUsuario(false); onReasignar(Number(usuarioId)) }}
      />
    </section>
  )
}
