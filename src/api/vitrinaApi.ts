import { axiosClient } from "./axiosClient"
import type { EstadoPublicacion, Origen as OrigenRepuesto, TipoRepuesto } from "./contratos/enumeraciones"
import { vitrinaMock } from "./vitrinaApi.mock"

/**
 * Vitrina interna (BE-E, Fase 3): /api/vitrina/productos. Trae costo y margen:
 * solo personal interno (permisos.ts, módulo "vitrina"). Nunca se usa en la landing ni el portal.
 */
export type FuenteImagen = "RECEPCION" | "PROVEEDOR" | "CLIENTE"
export type EvaluacionMargen = "NORMAL" | "CON_AVISO" | "FUERA_DE_RANGO"

export interface ImagenVitrina {
  idImagen: number
  url: string
  fuente: FuenteImagen | null
  principal: boolean
  verificada: boolean
}

export interface ProductoVitrina {
  idProducto: number
  codigo: string
  nombre: string
  descripcion: string | null
  idCategoria: number | null
  categoria: string | null
  idUnidadMedida: number | null
  unidad: string | null
  marca: string | null
  numeroParte: string | null
  tipoRepuesto: TipoRepuesto
  origen: OrigenRepuesto
  estado: EstadoPublicacion
  costoPuestoLima: number | null
  margen: number | null
  precioReferencial: number | null
  evaluacionMargen: EvaluacionMargen | null
  /** Margen fuera de rango: solo el Jefe Administrativo publica (D-26). */
  requiereJefe: boolean
  tieneImagenVerificada: boolean
  fechaUltimaVerificacion: string | null
  imagenes: ImagenVitrina[]
}

export interface ConvertirProductoRequest {
  idSourcing: number
  nombre: string
  descripcion?: string
  /** Obligatoria (D-22). */
  idCategoriaProducto: number
  /** Obligatoria (D-22). */
  idUnidadMedida: number
  idMarca?: number
  numeroParte?: string
  tipoRepuesto: TipoRepuesto
  origen?: OrigenRepuesto
  /** Si no viene, el de la referencia. */
  costoPuestoLima?: number
  /** Si no viene, MARGEN_REP_SUGERIDO (D-17). */
  margen?: number
}

export interface ImagenProductoRequest {
  urlImagen: string
  fuente: FuenteImagen
  principal: boolean
}

const RUTA = "/vitrina/productos"
const usarMock = import.meta.env.VITE_VITRINA_MOCK === "true"

export const vitrinaApi = {
  async listar(estado?: EstadoPublicacion): Promise<ProductoVitrina[]> {
    if (usarMock) return vitrinaMock.listar(estado)
    const { data } = await axiosClient.get<ProductoVitrina[]>(RUTA, { params: estado ? { estado } : undefined })
    return data
  },
  async detalle(id: number): Promise<ProductoVitrina> {
    if (usarMock) return vitrinaMock.detalle(id)
    const { data } = await axiosClient.get<ProductoVitrina>(`${RUTA}/${id}`)
    return data
  },
  async convertir(body: ConvertirProductoRequest): Promise<ProductoVitrina> {
    if (usarMock) return vitrinaMock.convertir(body)
    const { data } = await axiosClient.post<ProductoVitrina>(RUTA, body)
    return data
  },
  async agregarImagen(id: number, body: ImagenProductoRequest): Promise<ProductoVitrina> {
    if (usarMock) return vitrinaMock.agregarImagen(id, body)
    const { data } = await axiosClient.post<ProductoVitrina>(`${RUTA}/${id}/imagenes`, body)
    return data
  },
  async accion(id: number, accion: "publicar" | "ocultar" | "retirar" | "verificar"): Promise<ProductoVitrina> {
    if (usarMock) return vitrinaMock.accion(id, accion)
    const { data } = await axiosClient.post<ProductoVitrina>(`${RUTA}/${id}/${accion}`)
    return data
  },
}
