import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { vitrinaApi, type ConvertirProductoRequest, type ImagenProductoRequest } from "@/api/vitrinaApi"
import type { EstadoPublicacion } from "@/api/contratos/enumeraciones"
import { listarCategoriasProducto } from "@/api/categoriasApi"
import { listarUnidadesMedida } from "@/api/unidadesMedidaApi"
import { listarMarcas } from "@/api/marcasApi"

const CLAVE = ["vitrina-interna"] as const

export function useProductosVitrina(estado?: EstadoPublicacion) {
  return useQuery({ queryKey: [...CLAVE, "lista", estado ?? "todos"], queryFn: () => vitrinaApi.listar(estado) })
}

export function useProductoVitrina(id: number) {
  return useQuery({ queryKey: [...CLAVE, "detalle", id], queryFn: () => vitrinaApi.detalle(id), enabled: id > 0 })
}

export function useConvertirProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ConvertirProductoRequest) => vitrinaApi.convertir(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLAVE })
      qc.invalidateQueries({ queryKey: ["sourcing"] })
    },
  })
}

export function useAgregarImagen(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ImagenProductoRequest) => vitrinaApi.agregarImagen(id, body),
    onSuccess: (p) => {
      qc.setQueryData([...CLAVE, "detalle", id], p)
      qc.invalidateQueries({ queryKey: [...CLAVE, "lista"] })
    },
  })
}

export function useAccionVitrina(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (accion: "publicar" | "ocultar" | "retirar" | "verificar") => vitrinaApi.accion(id, accion),
    onSuccess: (p) => {
      qc.setQueryData([...CLAVE, "detalle", id], p)
      qc.invalidateQueries({ queryKey: [...CLAVE, "lista"] })
    },
  })
}

/** Catálogos para convertir (D-22): categoría y unidad obligatorias, marca opcional. */
export function useCatalogosProducto() {
  const opciones = { staleTime: 5 * 60_000 }
  const categorias = useQuery({ queryKey: ["categorias-producto"], queryFn: listarCategoriasProducto, ...opciones })
  const unidades = useQuery({ queryKey: ["unidades-medida"], queryFn: listarUnidadesMedida, ...opciones })
  const marcas = useQuery({ queryKey: ["marcas"], queryFn: listarMarcas, ...opciones })
  return { categorias, unidades, marcas }
}
