import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cotizacionesApi } from '@/api/cotizacionesApi'
import { avisar } from '@/lib/avisos'

export function useAprobacionCotizacion(id: number) {
  const cliente = useQueryClient()
  const listo = (texto: string) => () => {
    avisar(texto)
    void cliente.invalidateQueries({ queryKey: ['cotizaciones'] })
    void cliente.invalidateQueries({ queryKey: ['cotizaciones', id] })
  }
  return {
    solicitar: useMutation({
      mutationFn: () => cotizacionesApi.solicitarAprobacion(id),
      onSuccess: listo('Aprobación solicitada.'),
    }),
    aprobar: useMutation({
      mutationFn: () => cotizacionesApi.aprobarCotizacion(id),
      onSuccess: listo('Cotización aprobada por el Jefe.'),
    }),
    devolver: useMutation({
      mutationFn: (motivo: string) => cotizacionesApi.devolverCotizacion(id, { motivo }),
      onSuccess: listo('Cotización devuelta a borrador.'),
    }),
  }
}
