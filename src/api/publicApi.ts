import { axiosClient } from "./axiosClient"
import type { CoberturaMinera, ProductoPublico } from "@/types/portal.types"

/**
 * Contrato esperado del backend:
 * GET /public/catalogo -> ProductoPublico[] o { content: ProductoPublico[] }.
 * GET /public/cobertura -> CoberturaMinera[] o { content: CoberturaMinera[] }.
 * Estos endpoints son públicos y no requieren Authorization.
 */
export const publicApi = {
  async listarCatalogo(): Promise<ProductoPublico[]> {
    const { data } = await axiosClient.get<ProductoPublico[] | { content: ProductoPublico[] }>("/public/catalogo")
    return Array.isArray(data) ? data : data.content ?? []
  },
  async listarCobertura(): Promise<CoberturaMinera[]> {
    const { data } = await axiosClient.get<CoberturaMinera[] | { content: CoberturaMinera[] }>("/public/cobertura")
    return Array.isArray(data) ? data : data.content ?? []
  },
}
