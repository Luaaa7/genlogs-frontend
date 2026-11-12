import { axiosClient } from "./axiosClient"

/** Lo que devuelve GET /metas. porcentaje y cumple vienen null si no hay cotizaciones consideradas. */
export interface MetaPeriodo {
  anio: number
  mes: number
  metaPorcentaje: number
  cotizacionesEnPlazo: number
  cotizacionesConsideradas: number
  porcentaje: number | null
  cumple: boolean | null
}

export interface AccionCorrectiva {
  id: number
  anio: number
  mes: number
  descripcion: string
  estado: "PENDIENTE" | "HECHA"
  fecha: string
}

export async function consultarMeta(anio: number, mes: number): Promise<MetaPeriodo> {
  const { data } = await axiosClient.get<MetaPeriodo>("/metas", { params: { anio, mes } })
  return data
}

export async function listarAcciones(anio: number, mes: number): Promise<AccionCorrectiva[]> {
  const { data } = await axiosClient.get<AccionCorrectiva[]>(`/metas/${anio}/${mes}/acciones`)
  return data
}

export async function crearAccion(anio: number, mes: number, descripcion: string): Promise<AccionCorrectiva> {
  const { data } = await axiosClient.post<AccionCorrectiva>(`/metas/${anio}/${mes}/acciones`, { descripcion })
  return data
}

export async function marcarAccionHecha(id: number): Promise<AccionCorrectiva> {
  const { data } = await axiosClient.patch<AccionCorrectiva>(`/metas/acciones/${id}`, { estado: "HECHA" })
  return data
}
