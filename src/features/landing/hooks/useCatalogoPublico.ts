import { useQuery } from "@tanstack/react-query"
import { publicApi } from "@/api/publicApi"

export function useCatalogoPublico() {
  return useQuery({ queryKey: ["catalogo-publico"], queryFn: publicApi.listarCatalogo })
}
