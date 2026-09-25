import { MIME_TYPES_PERMITIDOS, TAMANIO_MAXIMO_BYTES, type TipoArchivo } from "@/lib/constants/uploads"

export interface ValidacionArchivoResult {
  valido: boolean
  error?: string
}

export function validarArchivo(file: File, tipo: TipoArchivo): ValidacionArchivoResult {
  const mimesPermitidos: readonly string[] = MIME_TYPES_PERMITIDOS[tipo]

  if (!mimesPermitidos.includes(file.type)) {
    return { valido: false, error: `Tipo de archivo no permitido. Formatos válidos: ${mimesPermitidos.join(", ")}` }
  }

  if (file.size > TAMANIO_MAXIMO_BYTES[tipo]) {
    const maxMB = TAMANIO_MAXIMO_BYTES[tipo] / (1024 * 1024)
    return { valido: false, error: `El archivo excede el tamaño máximo de ${maxMB}MB` }
  }

  return { valido: true }
}