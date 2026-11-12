import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { portalCotizacionesApi } from "@/api/portalCotizacionesApi"

export function useCotizacionesPortal() {
  return useQuery({ queryKey: ["portal-cotizaciones"], queryFn: portalCotizacionesApi.listar })
}

export function useCotizacionPortal(id: number | undefined) {
  return useQuery({
    queryKey: ["portal-cotizacion", id],
    queryFn: () => portalCotizacionesApi.detalle(id as number),
    enabled: typeof id === "number" && Number.isFinite(id),
  })
}

/** Aprobar o rechazar; al terminar refresca la cotización, la lista y los pedidos. */
export function useDecidirCotizacion(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ decision, motivo }: { decision: "aprobar" | "rechazar"; motivo?: string }) =>
      decision === "aprobar" ? portalCotizacionesApi.aprobar(id, motivo) : portalCotizacionesApi.rechazar(id, motivo),
    onSuccess: (cotizacion) => {
      queryClient.setQueryData(["portal-cotizacion", id], cotizacion)
      queryClient.invalidateQueries({ queryKey: ["portal-cotizaciones"] })
      queryClient.invalidateQueries({ queryKey: ["portal-pedidos"] })
    },
  })
}
