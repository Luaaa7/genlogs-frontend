import { useQuery } from '@tanstack/react-query'
import { usePermisos } from '@/lib/permisos'
import { listarAvisos } from '../api/avisosCotizacionApi'
import { avisoAltoValorDe } from '../lib/avisoAltoValor'
import { ROL_GERENTE_GENERAL } from '../lib/rolesCotizacion'

const vacio = { noLeidas: 0, avisos: [] }

/** Solo el Gerente consulta avisos. Si el GET falla, no hay banner y la cotización sigue. */
export function useAvisoAltoValor(id: number) {
  const { rol } = usePermisos()
  const gerente = rol === ROL_GERENTE_GENERAL
  const consulta = useQuery({
    queryKey: ['cotizacion-alto-valor', id],
    enabled: gerente,
    retry: false,
    queryFn: async () => {
      try {
        return await listarAvisos()
      } catch {
        return vacio
      }
    },
  })
  if (!gerente) return null
  return avisoAltoValorDe(id, consulta.data?.avisos ?? [])
}
