import { axiosClient } from "./axiosClient"
import type { CoberturaMinera, ProductoPublico } from "@/types/portal.types"
import type { TipoRepuesto } from "./contratos/enumeraciones"

/** Repuesto de la vitrina en la landing (BE-E). Sin precio y nunca con fuente ni enlace (D-13). */
export interface RepuestoPublico {
  idProducto: number
  nombre: string
  descripcion: string | null
  marca: string | null
  numeroParte: string | null
  idCategoria: number
  categoria: string
  tipoRepuesto: TipoRepuesto
  plazoEntrega: string
  /** Foto propia verificada; null → ícono de la categoría. */
  urlImagen: string | null
}

export interface CategoriaConteo {
  idCategoria: number
  nombre: string
  cantidad: number
}

export interface FiltroVitrina {
  q?: string
  idCategoria?: number
  marca?: string
}

const vitrinaMock = import.meta.env.VITE_VITRINA_MOCK === "true"

const REPUESTOS_MOCK: RepuestoPublico[] = [
  { idProducto: 1, nombre: "Filtro de combustible", descripcion: "Para cargador 980H", marca: "Caterpillar", numeroParte: "1R-0750", idCategoria: 3, categoria: "Filtros", tipoRepuesto: "OEM", plazoEntrega: "5 a 7 días hábiles", urlImagen: null },
  { idProducto: 2, nombre: "Rodamiento rígido de bolas", descripcion: null, marca: "SKF", numeroParte: "6205-2RS", idCategoria: 5, categoria: "Rodamientos", tipoRepuesto: "ALTERNATIVO", plazoEntrega: "24 a 48 horas", urlImagen: null },
  { idProducto: 3, nombre: "Filtro de aceite de motor", descripcion: null, marca: "Caterpillar", numeroParte: "1R-1808", idCategoria: 3, categoria: "Filtros", tipoRepuesto: "OEM", plazoEntrega: "24 a 48 horas", urlImagen: null },
]

function filtrarMock(f: FiltroVitrina): RepuestoPublico[] {
  const q = f.q?.trim().toLowerCase()
  return REPUESTOS_MOCK.filter((r) =>
    (!q || r.nombre.toLowerCase().includes(q) || (r.numeroParte ?? "").toLowerCase().includes(q)) &&
    (!f.idCategoria || r.idCategoria === f.idCategoria) &&
    (!f.marca || (r.marca ?? "").toLowerCase() === f.marca.toLowerCase()))
}

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
  /** Vitrina (Fase 3): GET /public/catalogo/repuestos, solo PUBLICADO, sin precio. */
  async listarRepuestos(filtro: FiltroVitrina = {}): Promise<RepuestoPublico[]> {
    if (vitrinaMock) return filtrarMock(filtro)
    const { data } = await axiosClient.get<RepuestoPublico[]>("/public/catalogo/repuestos", { params: filtro })
    return data
  },
  /** Categorías con cuántos repuestos publicados tienen. */
  async listarCategoriasVitrina(): Promise<CategoriaConteo[]> {
    if (vitrinaMock) return [{ idCategoria: 3, nombre: "Filtros", cantidad: 2 }, { idCategoria: 5, nombre: "Rodamientos", cantidad: 1 }]
    const { data } = await axiosClient.get<CategoriaConteo[]>("/public/catalogo/categorias")
    return data
  },
  async listarCobertura(): Promise<CoberturaMinera[]> {
    const { data } = await axiosClient.get<CoberturaMinera[] | { content: CoberturaMinera[] }>("/public/cobertura")
    return Array.isArray(data) ? data : data.content ?? []
  },
}
