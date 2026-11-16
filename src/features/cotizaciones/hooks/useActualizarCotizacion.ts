import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { cotizacionesApi } from '@/api/cotizacionesApi'
import type { Cotizacion, UpdateCotizacionRequest } from '@/types/cotizacion.types'

interface ErrorResponse {
  message: string
  status?: number
}

/** Guarda el mismo borrador. Invalida la lista, el detalle y las estadísticas. */
export function useActualizarCotizacion(id: number): UseMutationResult<
  Cotizacion,
  AxiosError<ErrorResponse>,
  UpdateCotizacionRequest
> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateCotizacionRequest) => cotizacionesApi.actualizarCotizacion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotizaciones'] })
      queryClient.invalidateQueries({ queryKey: ['cotizaciones', id] })
      queryClient.invalidateQueries({ queryKey: ['cotizaciones-estadisticas'] })
    },
  })
}
