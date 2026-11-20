import axios from "axios"
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

/**
 * Resultado de la consulta pública del RUC (RU3 a RU9). Nunca bloquea el registro:
 * "sinDato" y "limite" dejan escribir la razón social a mano.
 */
export type ResultadoRuc =
  | { tipo: "ok"; razonSocial: string }
  | { tipo: "sinDato" }
  | { tipo: "invalido" }
  | { tipo: "limite" }

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
  /**
   * GET /public/ruc/{ruc} (RU3). Contrato del backend: 200 con { razonSocial } (null es «sin dato»),
   * 400 «Ingresa un RUC válido» y 429 cuando la IP pasó el límite de consultas.
   * Usa axios sin los interceptores de axiosClient para no reintentar un 429 ni tocar la sesión.
   * Un error de red o un 5xx se trata como «sin dato». Si se cancela, relanza el error.
   */
  async consultarRazonSocial(ruc: string, signal?: AbortSignal): Promise<ResultadoRuc> {
    try {
      const { data } = await axios.get<{ razonSocial: string | null }>(`/public/ruc/${encodeURIComponent(ruc)}`, {
        baseURL: axiosClient.defaults.baseURL,
        timeout: 15_000,
        headers: { Accept: "application/json" },
        signal,
      })
      const razonSocial = data?.razonSocial?.trim()
      return razonSocial ? { tipo: "ok", razonSocial } : { tipo: "sinDato" }
    } catch (error) {
      if (axios.isCancel(error)) throw error
      const status = (error as { response?: { status?: number } }).response?.status
      if (status === 400) return { tipo: "invalido" }
      if (status === 429) return { tipo: "limite" }
      return { tipo: "sinDato" }
    }
  },
  async listarCobertura(): Promise<CoberturaMinera[]> {
    const { data } = await axiosClient.get<CoberturaMinera[] | { content: CoberturaMinera[] }>("/public/cobertura")
    return Array.isArray(data) ? data : data.content ?? []
  },
}