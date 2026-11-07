import { useQuery } from "@tanstack/react-query"
import { obtenerVistaPrevia } from "@/api/reportesApi"
import type { ReporteRequest } from "@/types/reporte.types"
import type { ReporteVistaPreviaResponse } from "@/api/reportesApi"

export function useVistaPreviaReporte<T = Record<string, unknown>>(
  request: ReporteRequest | null,
) {
  const query = useQuery<ReporteVistaPreviaResponse<T>>({
    queryKey: ["reporte-vista-previa", request],
    queryFn: () => obtenerVistaPrevia<T>(request!),
    enabled: request !== null,
    staleTime: 30_000,
    retry: false, // la API ya maneja 404 sin lanzar
    placeholderData: (prev: ReporteVistaPreviaResponse<T> | undefined) => prev,
  })
  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}