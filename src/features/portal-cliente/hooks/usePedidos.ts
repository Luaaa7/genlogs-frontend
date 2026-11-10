import { useQuery } from "@tanstack/react-query"
import { portalApi } from "@/api/portalApi"

export function usePedidos() {
  return useQuery({ queryKey: ["portal-pedidos"], queryFn: portalApi.listarPedidos })
}
