import { useMutation, useQueryClient } from "@tanstack/react-query"
import { portalApi } from "@/api/portalApi"

export function useCrearSolicitud() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: portalApi.crearSolicitud,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portal-pedidos"] }),
  })
}
