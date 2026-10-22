import { axiosClient } from "./axiosClient"
import type { ReporteRequest } from "@/types/reporte.types"

export async function generarReporte(request: ReporteRequest): Promise<Blob> {
  const { data } = await axiosClient.post("/reportes/generar", request, {
    responseType: "blob",
  })
  return data
}

export async function obtenerPreviewReporte(request: ReporteRequest): Promise<{ data: Record<string, unknown>[]; total: number }> {
  const { data } = await axiosClient.post<{ data: Record<string, unknown>[]; total: number }>("/reportes/preview", request)
  return data
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