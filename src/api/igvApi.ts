import { axiosClient } from "./axiosClient"

/** Tasa del IGV configurable (backend: /api/catalogos/igv). */
export interface TasaIgv {
  idTasaIgv: number
  /** Porcentaje, por ejemplo 18 */
  porcentaje: number
  /** "2027-01-01" */
  vigenteDesde: string
  userCreate?: string | null
  dateCreate?: string | null
}

/** Si el backend todavía no tiene el endpoint, se usa la tasa del Perú desde 2011. */
export const IGV_POR_DEFECTO = 18

export async function obtenerIgvVigente(): Promise<number> {
  const { data } = await axiosClient.get<{ porcentaje: number }>("/catalogos/igv")
  const p = Number(data?.porcentaje)
  return Number.isFinite(p) ? p : IGV_POR_DEFECTO
}

export async function listarHistorialIgv(): Promise<TasaIgv[]> {
  const { data } = await axiosClient.get<TasaIgv[]>("/catalogos/igv/historial")
  return Array.isArray(data) ? data : []
}

export async function registrarTasaIgv(porcentaje: number, vigenteDesde: string): Promise<TasaIgv> {
  const { data } = await axiosClient.post<TasaIgv>("/catalogos/igv", { porcentaje, vigenteDesde })
  return data
}