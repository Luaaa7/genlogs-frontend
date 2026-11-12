import { useQuery } from '@tanstack/react-query'
import type { FiltrosSolicitudes } from '@/api/contratos/solicitudes'
import { solicitudesInternasApi } from '../api/solicitudesInternasApi'

export function useSolicitudesInternas(filtros: FiltrosSolicitudes) {
  return useQuery({
    queryKey: ['solicitudes-internas', filtros],
    queryFn: () => solicitudesInternasApi.listar(filtros),
  })
}
