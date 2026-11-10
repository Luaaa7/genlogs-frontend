import { useQuery } from "@tanstack/react-query"
import { publicApi } from "../../api/publicApi"

export function useCatalogoPublico() {
  return useQuery({ queryKey: ["catalogo-publico"], queryFn: publicApi.listarCatalogo })
}

export function useCobertura() {
  return useQuery({ queryKey: ["cobertura-publica"], queryFn: publicApi.listarCobertura })
}
