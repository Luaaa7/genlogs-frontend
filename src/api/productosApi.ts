import axios from "axios"
import { http } from "./http"
import type {
  DocumentoNuevo,
  ImagenNueva,
  Producto,
  ProductoFiltros,
  ProductoRequest,
} from "@/types/producto.types"
import type { PageResponse } from "@/types/common.types"
import { limpiarFiltros } from "@/lib/utils/pagination"

export async function listarProductos(filtros: ProductoFiltros = {}): Promise<PageResponse<Producto>> {
  const { data } = await http.get<PageResponse<Producto>>("/productos", {
    params: limpiarFiltros(filtros),
  })
  return data
}

export async function obtenerProducto(id: number): Promise<Producto> {
  const { data } = await http.get<Producto>(`/productos/${id}`)
  return data
}

export async function crearProducto(payload: ProductoRequest): Promise<Producto> {
  const { data } = await http.post<Producto>("/productos", payload)
  return data
}

export async function actualizarProducto(id: number, payload: ProductoRequest): Promise<Producto> {
  const { data } = await http.put<Producto>(`/productos/${id}`, payload)
  return data
}

export async function eliminarProducto(id: number): Promise<void> {
  await http.delete(`/productos/${id}`)
}

export async function agregarImagenProducto(idProducto: number, imagen: ImagenNueva): Promise<void> {
  await http.post(`/productos/${idProducto}/imagenes`, {
    urlImagen: imagen.url,
    esPrincipal: imagen.esPrincipal,
  })
}

export async function agregarDocumentoProducto(
  idProducto: number,
  documento: DocumentoNuevo
): Promise<void> {
  await http.post(`/productos/${idProducto}/documentos`, {
    tipoDocumento: documento.tipoDocumento,
    nombreDocumento: documento.nombreDocumento,
    urlDocumento: documento.url,
  })
}

/** Extrae el mensaje de error que devuelve Spring (`message`) o usa uno por defecto. */
export function mensajeErrorApi(error: unknown, porDefecto: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    if (data?.message) return data.message
    if (error.response?.status === 409) return "La operación entra en conflicto con datos existentes."
    if (error.response?.status === 403) return "No tienes permisos para realizar esta acción."
    if (!error.response) return "Sin conexión con el servidor. Revisa tu red."
  }
  return porDefecto
}