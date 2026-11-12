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

export async function consultarMeta(anio: number, mes: number): Promise<MetaPeriodo> {
  const { data } = await axiosClient.get<MetaPeriodo>("/metas", { params: { anio, mes } })
  return data
}
