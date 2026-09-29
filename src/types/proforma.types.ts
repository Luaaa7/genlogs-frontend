// src/types/proforma.types.ts
import type { Moneda } from "./cotizacion.types"

export const EstadoProforma = {
  PENDIENTE: "PENDIENTE",
  APROBADA: "APROBADA",
  RECHAZADA: "RECHAZADA",
} as const

export type EstadoProforma = (typeof EstadoProforma)[keyof typeof EstadoProforma]

export const ESTADOS_PROFORMA: readonly EstadoProforma[] = Object.values(EstadoProforma)

export const ETIQUETA_ESTADO_PROFORMA: Record<EstadoProforma, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
}

/** Archivo adjunto ya subido a Cloudinary (misma forma que devuelve el FileUploader). */
export interface AdjuntoProforma {
  id?: number
  nombreArchivo: string
  url: string
  tipoArchivo: string
  tamanioBytes: number
}

/** Modelo de dominio que consume la UI (siempre camelCase). */
export interface Proforma {
  id: number
  cotizacionId: number
  cotizacionCodigo?: string
  clienteNombre?: string
  moneda: Moneda
  subtotal: number
  igv: number
  total: number
  estadoProforma: EstadoProforma
  /** Formato NNNN-NN (ej. 0001-26). Lo asigna el backend. */
  numeroOrdenCompra: string | null
  fechaEmision?: string
  fechaVencimiento?: string
  fechaCreacion?: string
  observaciones?: string
  adjuntos: AdjuntoProforma[]
}

/** Forma que llega por la red: el número de orden de compra puede venir en camelCase o snake_case. */
export interface ProformaResponse extends Omit<Proforma, "numeroOrdenCompra" | "adjuntos"> {
  numeroOrdenCompra?: string | null
  numero_orden_compra?: string | null
  adjuntos?: AdjuntoProforma[] | null
}

export interface ProformaRequest {
  /** Debe ser una cotización en estado APROBADA. */
  cotizacionId: number
  fechaVencimiento?: string
  observaciones?: string
  adjuntos: AdjuntoProforma[]
}

export interface ProformasFiltros {
  estadoProforma?: EstadoProforma
  /** Base 0, igual que Spring Data. */
  page?: number
  size?: number
  sortBy?: string
  sortDir?: "ASC" | "DESC"
}

/** Respuesta paginada tal como la envía Spring (los nombres de página varían según el DTO). */
export interface ProformasListResponse {
  content: ProformaResponse[]
  totalElements: number
  totalPages: number
  page?: number
  currentPage?: number
  number?: number
  size?: number
  pageSize?: number
}

/** Página ya normalizada para la UI. */
export interface ProformasPage {
  content: Proforma[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}