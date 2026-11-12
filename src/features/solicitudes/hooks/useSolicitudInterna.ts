import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PausarSolicitudRequest, SolicitudInternaResponse } from '@/api/contratos/solicitudes'
import type { TipoPlazo } from '@/api/contratos'
import { avisar } from '@/lib/avisos'
import { solicitudesInternasApi } from '../api/solicitudesInternasApi'

export function useHistorialSolicitud(id: number, activo: boolean) {
  return useQuery({
    queryKey: ['solicitud-historial', id],
    queryFn: () => solicitudesInternasApi.historial(id),
    enabled: activo,
    retry: false,
  })
}

export function useAccionesSolicitud(id: number, alActualizar: (solicitud: SolicitudInternaResponse) => void) {
  const cliente = useQueryClient()
  const listo = (texto: string) => (data: SolicitudInternaResponse) => {
    alActualizar(data)
    avisar(texto)
    void cliente.invalidateQueries({ queryKey: ['solicitud-historial', id] })
  }
  return {
    iniciar: useMutation({ mutationFn: () => solicitudesInternasApi.iniciar(id), onSuccess: listo('Revisión iniciada.') }),
    pausar: useMutation({ mutationFn: (body: PausarSolicitudRequest) => solicitudesInternasApi.pausar(id, body), onSuccess: listo('Solicitud pausada.') }),
    reanudar: useMutation({ mutationFn: () => solicitudesInternasApi.reanudar(id), onSuccess: listo('Revisión reanudada.') }),
    reclasificar: useMutation({ mutationFn: (tipoPlazo: TipoPlazo) => solicitudesInternasApi.reclasificar(id, { tipoPlazo }), onSuccess: listo('Plazo reclasificado.') }),
    reasignar: useMutation({ mutationFn: (idUsuario: number) => solicitudesInternasApi.reasignar(id, { idUsuario }), onSuccess: listo('Solicitud reasignada.') }),
  }
}
