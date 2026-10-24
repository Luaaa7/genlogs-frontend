import { axiosClient } from "./axiosClient"
import type { ReporteRequest } from "@/types/reporte.types"
import type { AxiosError } from "axios"

/** Respuesta del endpoint de vista previa: filas + total de registros. */
export interface ReporteVistaPreviaResponse<T = Record<string, unknown>> {
  filas: T[]
  total: number
  columnas: string[]
}

/** Genera y descarga el archivo (PDF/Excel). */
export async function generarReporte(request: ReporteRequest): Promise<Blob> {
  const { data } = await axiosClient.post("/reportes/generar", request, {
    responseType: "blob",
  })
  return data
}

/**
 * Obtiene datos para la vista previa (JSON) usando los mismos filtros.
 * Si el endpoint no existe (404) devuelve una respuesta vacía en lugar de lanzar.
 */
export async function obtenerVistaPrevia<T = Record<string, unknown>>(
  request: ReporteRequest,
): Promise<ReporteVistaPreviaResponse<T>> {
  try {
    const { data } = await axiosClient.post<ReporteVistaPreviaResponse<T>>(
      "/reportes/vista-previa",
      request,
    )
    return data
  } catch (err) {
    const axiosError = err as AxiosError
    if (axiosError.response?.status === 404) {
      // Endpoint no implementado aún → devolvemos estructura vacía
      return { filas: [], total: 0, columnas: [] } as ReporteVistaPreviaResponse<T>
    }
    throw err
  }
}

export function descargarBlob(blob: Blob, nombreArchivo: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = nombreArchivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}