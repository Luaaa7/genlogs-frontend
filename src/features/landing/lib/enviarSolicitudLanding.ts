import axios from "axios"
import { axiosClient } from "@/api/axiosClient"
import { RUTA_SOLICITUDES, type SolicitudCreadaResponse, type SolicitudRequest } from "@/api/contratos/solicitudes"
import type { PedidoPendiente } from "./pedidoPendiente"

/**
 * Envía la solicitud rápida al endpoint único (POST /api/solicitudes, canal LANDING).
 * Usa axios sin los interceptores de axiosClient: en la landing esos pondrían el token
 * interno y, ante un 401, mandarían al login del personal. Aquí va el token del
 * cliente y la pantalla decide qué hacer con cada error.
 */
export async function enviarSolicitudLanding(
  pedido: Pick<PedidoPendiente, "marca" | "numeroParte" | "descripcion" | "cantidad">,
  token: string,
): Promise<SolicitudCreadaResponse> {
  const numeroParte = pedido.numeroParte.trim()
  const marca = pedido.marca.trim()
  const descripcion = pedido.descripcion.trim()
  const body: SolicitudRequest = {
    canal: "LANDING",
    asunto: (numeroParte ? `${marca ? `${marca} ` : ""}${numeroParte}` : descripcion).slice(0, 150),
    descripcion,
    items: [
      {
        descripcion: descripcion.slice(0, 255),
        cantidad: pedido.cantidad,
        ...(marca ? { marcaTexto: marca } : {}),
        ...(numeroParte ? { numeroParte } : {}),
      },
    ],
  }
  const { data } = await axios.post<SolicitudCreadaResponse>(RUTA_SOLICITUDES, body, {
    baseURL: axiosClient.defaults.baseURL,
    timeout: 60_000,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  })
  return data
}
