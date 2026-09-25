import type { AuditFields } from "./common.types"

export interface CaracteristicaProducto {
  idCaracteristica: number
  nombreCaracteristica: string
  unidadCaracteristica?: string
  valorCaracteristica: string
}

export interface ImagenProducto {
  idProductoImagen: number
  urlImagen: string
  esPrincipal: boolean
}

export interface DocumentoProducto {
  idDocumento: number
  tipoDocumento: "FICHA_TECNICA" | "CATALOGO" | "MANUAL" | "CERTIFICADO" | "HOJA_SEGURIDAD" | "OTRO"
  nombreDocumento: string
  urlDocumento: string
}

export interface Producto extends AuditFields {
  idProducto: number
  idCategoriaProducto: number
  categoriaNombre?: string
  idMarca?: number
  marcaNombre?: string
  idUnidadMedida: number
  codigoProducto: string
  nombreProducto: string
  procedencia?: string
  visibleWeb: boolean
  descripcion?: string
  caracteristicas: CaracteristicaProducto[]
  imagenes: ImagenProducto[]
  documentos: DocumentoProducto[]
}

export interface ProductoRequest {
  idCategoriaProducto: number
  idMarca?: number
  idUnidadMedida: number
  codigoProducto: string
  nombreProducto: string
  procedencia?: string
  visibleWeb: boolean
  descripcion?: string
  caracteristicas?: Omit<CaracteristicaProducto, "idCaracteristica">[]
}

export interface ProductoFiltros {
  codigo?: string
  nombre?: string
  idCategoriaProducto?: number
  idMarca?: number
  page?: number
  size?: number
}