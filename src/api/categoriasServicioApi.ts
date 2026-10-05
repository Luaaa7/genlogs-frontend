import { axiosClient } from "./axiosClient"

export interface CategoriaServicio {
  idCategoriaServicio: number
  idCategoriaPadre?: number
  nombreCategoria: string
  slugWeb: string
}

export async function listarCategoriasServicio(): Promise<CategoriaServicio[]> {
  // La ruta real es /api/catalogos/categorias-servicio (CategoriaServicioController);
  // /api/categorias-servicio no existe y devolvía 404.
  const { data } = await axiosClient.get<CategoriaServicio[]>("/catalogos/categorias-servicio")
  return data
}