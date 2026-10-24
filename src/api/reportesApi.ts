import { axiosClient } from "./axiosClient"
import type { ReporteRequest } from "@/types/reporte.types"
import type { AxiosError } from "axios"

/** Respuesta del endpoint de vista previa: filas + total de registros. */
export interface ReporteVistaPreviaResponse<T = Record<string, unknown>> {
  filas: T[]
  total: number
  columnas: string[]
}

/** Lo que responde POST /reportes/preview: encabezados + filas como arreglos de texto. */
interface PreviewBackend {
  // Formato actual: encabezados + filas como arreglos
  encabezados?: string[]
  filas?: string[][]
  totalFilas?: number
  // Formato anterior: filas como objetos
  data?: Record<string, unknown>[]
  total?: number
}

/** Convierte la respuesta del backend (filas como arreglos) al formato de la tabla (filas como objetos). */
export function adaptarPreview<T = Record<string, unknown>>(
  data: PreviewBackend,
): ReporteVistaPreviaResponse<T> {
  // Formato anterior ({ data: [...], total }): las filas ya son objetos.
  if (Array.isArray(data.data)) {
    const columnas = data.data.length > 0 ? Object.keys(data.data[0]) : []
    return { filas: data.data as T[], total: data.total ?? data.data.length, columnas }
  }
  const usados = new Map<string, number>()
  // Si un encabezado se repite se le agrega un sufijo para no pisar columnas.
  const columnas = (data.encabezados ?? []).map((h) => {
    const n = (usados.get(h) ?? 0) + 1
    usados.set(h, n)
    return n === 1 ? h : `${h} (${n})`
  })
  const filas = (data.filas ?? []).map(
    (fila) => Object.fromEntries(columnas.map((c, i) => [c, fila[i] ?? null])) as T,
  )
  return { filas, total: data.totalFilas ?? filas.length, columnas }
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
    const { data } = await axiosClient.post<PreviewBackend>("/reportes/preview", request)
    return adaptarPreview<T>(data)
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