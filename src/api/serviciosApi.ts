import { axiosClient } from "./axiosClient"
import type { Servicio, ServicioFormValues } from "@/types/servicio.types"

interface ListarServiciosParams {
  soloActivos?: boolean
  idCategoriaServicio?: number
}

export async function listarServicios(params: ListarServiciosParams = {}): Promise<Servicio[]> {
  const { data } = await axiosClient.get<Servicio[]>("/servicios", {
    params: {
      soloActivos: params.soloActivos ?? true,
      idCategoriaServicio: params.idCategoriaServicio,
    },
  })
  return data
}

export async function buscarServicioPorId(id: number): Promise<Servicio> {
  const { data } = await axiosClient.get<Servicio>(`/servicios/${id}`)
  return data
}

/** Datos del formulario + la URL de la foto que se subió con el FileUploader (opcional). */
export type ServicioConImagen = ServicioFormValues & { imagenUrl?: string }

/** Asocia una imagen ya subida (Cloudinary) al servicio, como imagen principal. */
export async function asociarImagenServicio(idServicio: number, urlImagen: string): Promise<void> {
  await axiosClient.post(`/servicios/${idServicio}/imagenes`, { urlImagen, esPrincipal: true })
}

/**
 * El backend recibe la entidad Servicio: categoría y unidad de medida van como objetos
 * anidados ({ idCategoriaServicio }, { idUnidadMedida }), no como ids sueltos.
 */
function aCuerpoServicio(valores: ServicioFormValues) {
  const { idCategoriaServicio, idUnidadMedida, ...resto } = valores
  return {
    ...resto,
    categoriaServicio: { idCategoriaServicio },
    unidadMedida: { idUnidadMedida },
  }
}

export async function registrarServicio({ imagenUrl, ...valores }: ServicioConImagen): Promise<Servicio> {
  const { data } = await axiosClient.post<Servicio>("/servicios", aCuerpoServicio(valores))
  if (imagenUrl) await asociarImagenServicio(data.idServicio, imagenUrl)
  return data
}

export async function actualizarServicio(id: number, { imagenUrl, ...valores }: ServicioConImagen): Promise<Servicio> {
  const { data } = await axiosClient.put<Servicio>(`/servicios/${id}`, aCuerpoServicio(valores))
  if (imagenUrl) await asociarImagenServicio(id, imagenUrl)
  return data
}

export async function desactivarServicio(id: number): Promise<void> {
  await axiosClient.delete(`/servicios/${id}`)
}