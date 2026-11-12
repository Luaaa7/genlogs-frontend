import { axiosClient } from "./axiosClient"
import { RUTA_NOTIFICACIONES, type AvisosResponse } from "./contratos/notificaciones"

let usarMock = false
usarMock = false // cambia este false por true para encender el mock

function avisosDeMock(): AvisosResponse {
  return { noLeidas: 0, avisos: [] }
}

/** GET /notificaciones. El backend ya limita la lista al usuario de la sesión. */
export async function listarAvisos(): Promise<AvisosResponse> {
  if (usarMock) return avisosDeMock()
  const { data } = await axiosClient.get<AvisosResponse>(RUTA_NOTIFICACIONES)
  return data
}
