import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { crearAccion, listarAcciones, marcarAccionHecha } from "@/api/metasApi"

export function useAcciones(anio: number, mes: number) {
  return useQuery({
    queryKey: ["acciones", anio, mes],
    queryFn: () => listarAcciones(anio, mes),
    retry: false,
  })
}

export function useCrearAccion(anio: number, mes: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (descripcion: string) => crearAccion(anio, mes, descripcion),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["acciones", anio, mes] }),
  })
}

export function useMarcarAccionHecha(anio: number, mes: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => marcarAccionHecha(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["acciones", anio, mes] }),
  })
}
