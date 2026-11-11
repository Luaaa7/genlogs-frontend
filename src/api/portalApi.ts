import { axiosClient } from "./axiosClient"
import { RUTA_SOLICITUDES, type SolicitudCreadaResponse, type SolicitudRequest } from "./contratos"
import type {
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
 * POST /solicitudes: endpoint único del Paso 0 (contrato en @/api/contratos/solicitudes).
 * El portal manda canal PORTAL; cada ítem lleva marcaTexto, numeroParte, gtin y urlFoto (D-01).
 * POST /solicitudes/fotos recibe un archivo multipart "file" (JPG, PNG, WEBP o PDF,
 * hasta 5 MB) y devuelve { url }; la URL va en urlFoto del ítem.
 * Todas las rutas /portal/* requieren el token del cliente.
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
  crearSolicitud: (payload: SolicitudRequest) =>
    axiosClient.post<SolicitudCreadaResponse>(RUTA_SOLICITUDES, payload).then((response) => response.data),
  subirFotoSolicitud: (archivo: File) => {
    const form = new FormData()
    form.append("file", archivo)
    return axiosClient
      .post<{ url: string }>(`${RUTA_SOLICITUDES}/fotos`, form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((response) => response.data.url)
  },
}
