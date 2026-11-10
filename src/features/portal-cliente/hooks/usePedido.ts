import { useQuery } from "@tanstack/react-query"
import { portalApi } from "@/api/portalApi"

export function usePedido(id: string | undefined) {
  return useQuery({
    queryKey: ["portal-pedido", id],
    queryFn: () => portalApi.obtenerPedido(id ?? ""),
    enabled: Boolean(id),
  })
}
