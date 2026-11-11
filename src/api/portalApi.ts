import { axiosClient } from "./axiosClient"
import type {
  CrearSolicitudRequest,
  CrearSolicitudResponse,
  ListaPedidosResponse,
  Pedido,
  RegistroClienteRequest,
  RegistroClienteResponse,
} from "@/types/portal.types"

/**
 * Contrato esperado del backend:
 * POST /portal/registro recibe RegistroClienteRequest y devuelve
 * RegistroClienteResponse (puede incluir token para iniciar sesión).
 * GET /portal/pedidos devuelve Pedido[] o { content/pedidos, total }.
 * GET /portal/pedidos/:id devuelve Pedido.
 * POST /portal/solicitudes recibe CrearSolicitudRequest y devuelve
 * CrearSolicitudResponse. Todas las rutas /portal/* requieren el token del cliente.
 */
export const portalApi = {
  registrarCliente: (payload: RegistroClienteRequest) =>
    axiosClient.post<RegistroClienteResponse>("/portal/registro", payload).then((response) => response.data),
  listarPedidos: () =>
    axiosClient.get<ListaPedidosResponse | Pedido[]>("/portal/pedidos").then(({ data }) => {
      if (Array.isArray(data)) return data
      return data.content ?? data.pedidos ?? []
    }),
  obtenerPedido: (id: string) =>
    axiosClient.get<Pedido>(`/portal/pedidos/${encodeURIComponent(id)}`).then((response) => response.data),
  cancelarPedido: (id: string, motivo?: string) =>
    axiosClient
      .patch<void>(`/portal/pedidos/${encodeURIComponent(id)}/cancelar`, { motivo: motivo?.trim() || null })
      .then(() => undefined),
  crearSolicitud: (payload: CrearSolicitudRequest) =>
    axiosClient.post<CrearSolicitudResponse>("/portal/solicitudes", payload).then((response) => response.data),
}
