import { axiosClient } from "./axiosClient"

export interface Distrito {
  idDistrito: number
  nombreDistrito: string
  // El backend puede incluir provincia/departamento si existe
  provincia?: string
  departamento?: string
}

export async function listarDistritos(): Promise<Distrito[]> {
  // Siguiendo el patrón de /catalogos/sectores-economicos
  const { data } = await axiosClient.get<Distrito[]>("/catalogos/distritos")
  return data
}