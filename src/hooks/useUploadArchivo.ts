import { useState } from "react"
import { subirArchivo, type CloudinaryUploadResponse } from "@/api/cloudinaryApi"
import { validarArchivo } from "@/lib/validators/archivo.schema"
import type { TipoArchivo } from "@/lib/constants/uploads"

interface UseUploadArchivoResult {
  subir: (file: File) => Promise<CloudinaryUploadResponse | null>
  progreso: number
  subiendo: boolean
  error: string | null
}

export function useUploadArchivo(tipo: TipoArchivo): UseUploadArchivoResult {
  const [progreso, setProgreso] = useState(0)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function subir(file: File): Promise<CloudinaryUploadResponse | null> {
    setError(null)
    const validacion = validarArchivo(file, tipo)
    if (!validacion.valido) {
      setError(validacion.error ?? "Archivo inválido")
      return null
    }
    try {
      setSubiendo(true)
      setProgreso(0)
      return await subirArchivo(file, setProgreso)
    } catch {
      setError("Error al subir el archivo. Intenta nuevamente.")
      return null
    } finally {
      setSubiendo(false)
    }
  }

  return { subir, progreso, subiendo, error }
}