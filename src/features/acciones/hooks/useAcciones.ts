import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { cambiarEstadoAccion, crearAccion, listarAcciones, type AccionCorrectiva } from "@/api/metasApi"

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

/** Marca una acción como HECHA o la reabre (PENDIENTE). */
export function useCambiarEstadoAccion(anio: number, mes: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: AccionCorrectiva["estado"] }) => cambiarEstadoAccion(id, estado),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["acciones", anio, mes] }),
  })
}
