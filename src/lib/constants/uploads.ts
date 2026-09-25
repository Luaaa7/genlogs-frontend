export const MIME_TYPES_PERMITIDOS = {
  imagen: ["image/jpeg", "image/png", "image/webp"],
  documento: ["application/pdf", "image/jpeg", "image/png"],
} as const

export const TAMANIO_MAXIMO_BYTES = {
  imagen: 5 * 1024 * 1024,
  documento: 10 * 1024 * 1024,
} as const

export type TipoArchivo = keyof typeof MIME_TYPES_PERMITIDOS