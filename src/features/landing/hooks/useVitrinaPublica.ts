import { useQuery } from "@tanstack/react-query"
import { publicApi, type FiltroVitrina } from "@/api/publicApi"

export function useRepuestosPublicos(filtro: FiltroVitrina) {
  return useQuery({
    queryKey: ["vitrina-publica", "repuestos", filtro],
    queryFn: () => publicApi.listarRepuestos(filtro),
    placeholderData: (anterior) => anterior,
  })
}

export function useCategoriasVitrina() {
  return useQuery({ queryKey: ["vitrina-publica", "categorias"], queryFn: publicApi.listarCategoriasVitrina, staleTime: 5 * 60_000 })
}
