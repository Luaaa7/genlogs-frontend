import { axiosClient } from "./axiosClient"

export interface Distrito {
  idDistrito: number
  nombreDistrito: string
  ubigeo: string
  provincia: {
    idProvincia: number
    nombreProvincia: string
    departamento: {
      idDepartamento: number
      nombreDepartamento: string
    }
  }
}

export async function listarDistritos(): Promise<Distrito[]> {
  const { data } = await axiosClient.get<Distrito[]>("/catalogos/distritos")
  return data
}