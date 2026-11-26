import { useQuery } from '@tanstack/react-query'
import { listarUsuarios } from '@/api/usuariosApi'
import { filtrarAsignables, mensajeCargaUsuarios } from '../lib/reglasSolicitud'

/**
 * Personal al que el Jefe puede reasignar (y por el que se filtra la lista). Siempre del servidor:
 * GET /usuarios. Con `activo` en false no se pide nada (por ejemplo, un asistente recibiría 403).
 */
export function useAsignables(activo: boolean) {
  const consulta = useQuery({
    queryKey: ['asignables-solicitud'],
    queryFn: () => listarUsuarios(),
    enabled: activo,
    retry: false,
  })
  if (!activo) return { usuarios: [], error: null as string | null, cargando: false }
  return {
    usuarios: consulta.data ? filtrarAsignables(consulta.data) : [],
    error: consulta.error ? mensajeCargaUsuarios(consulta.error) : null,
    cargando: consulta.isLoading,
  }
}
