import axiosClient from "./axiosClient"
import type { Producto, ProductoRequest, ProductoFiltros } from "@/types/producto.types"
import type { PageResponse } from "@/types/common.types"

export async function listarProductos(filtros: ProductoFiltros): Promise<PageResponse<Producto>> {
  const { data } = await axiosClient.get<PageResponse<Producto>>("/productos", { params: filtros })
  return data
}

export async function obtenerProducto(id: number): Promise<Producto> {
  const { data } = await axiosClient.get<Producto>(`/productos/${id}`)
  return data
}

export async function crearProducto(payload: ProductoRequest): Promise<Producto> {
  const { data } = await axiosClient.post<Producto>("/productos", payload)
  return data
}

export async function actualizarProducto(id: number, payload: ProductoRequest): Promise<Producto> {
  const { data } = await axiosClient.put<Producto>(`/productos/${id}`, payload)
  return data
}

export async function eliminarProducto(id: number): Promise<void> {
  await axiosClient.delete(`/productos/${id}`)
}

export async function agregarImagenProducto(idProducto: number, urlImagen: string, esPrincipal: boolean): Promise<void> {
  await axiosClient.post(`/productos/${idProducto}/imagenes`, { urlImagen, esPrincipal })
}

export async function agregarDocumentoProducto(
  idProducto: number,
  tipoDocumento: string,
  nombreDocumento: string,
  urlDocumento: string
): Promise<void> {
  await axiosClient.post(`/productos/${idProducto}/documentos`, { tipoDocumento, nombreDocumento, urlDocumento })
}