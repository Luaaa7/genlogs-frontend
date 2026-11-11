import { useMutation, useQueryClient } from "@tanstack/react-query"
import { portalApi } from "@/api/portalApi"

export function useCancelarPedido(id: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (motivo: string) => portalApi.cancelarPedido(id ?? "", motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal-pedido", id] })
      queryClient.invalidateQueries({ queryKey: ["portal-pedidos"] })
    },
  })
}
