import { axiosClient } from "./axiosClient"

export interface SectorEconomico {
  idSectorEconomico: number
  nombreSector: string
  descripcion?: string
}

export async function listarSectoresEconomicos(): Promise<SectorEconomico[]> {
  // La ruta real es /api/catalogos/sectores-economicos (SectorEconomicoController);
  // /api/sectores-economicos no existe y devolvía 404.
  const { data } = await axiosClient.get<SectorEconomico[]>("/catalogos/sectores-economicos")
  return data
}