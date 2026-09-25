import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as productosApi from "@/api/productosApi"
import type { ProductoFiltros, ProductoRequest } from "@/types/producto.types"

export function useProductos(filtros: ProductoFiltros) {
  return useQuery({ queryKey: ["productos", filtros], queryFn: () => productosApi.listarProductos(filtros) })
}

export function useProducto(id: number) {
  return useQuery({ queryKey: ["producto", id], queryFn: () => productosApi.obtenerProducto(id), enabled: !!id })
}

export function useCrearProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProductoRequest) => productosApi.crearProducto(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productos"] }),
  })
}

export function useActualizarProducto(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProductoRequest) => productosApi.actualizarProducto(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] })
      queryClient.invalidateQueries({ queryKey: ["producto", id] })
    },
  })
}