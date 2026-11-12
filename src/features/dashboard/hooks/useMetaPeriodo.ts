import { useQuery } from "@tanstack/react-query"
import { consultarMeta } from "@/api/metasApi"

export function useMetaPeriodo(anio: number, mes: number) {
  return useQuery({
    queryKey: ["metas", anio, mes],
    queryFn: () => consultarMeta(anio, mes),
    retry: false,
  })
}
