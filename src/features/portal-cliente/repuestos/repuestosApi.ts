import { axiosClient } from "@/api/axiosClient"
import { RUTA_SOLICITUDES, type SolicitudCreadaResponse, type SolicitudRequest } from "@/api/contratos/solicitudes"
import type { TipoRepuesto } from "@/api/contratos/enumeraciones"
import type { ItemCarrito } from "./lib/carrito"

/** Repuesto del portal (BE-E): con precio referencial en soles; nunca fuente ni enlace (D-13). */
export interface RepuestoPortal {
  idProducto: number
  nombre: string
  descripcion: string | null
  marca: string | null
  numeroParte: string | null
  idCategoria: number
  categoria: string
  unidad: string | null
  tipoRepuesto: TipoRepuesto
  plazoEntrega: string
  urlImagen: string | null
  precioReferencial: number | null
  moneda: string
}

const usarMock = import.meta.env.VITE_VITRINA_MOCK === "true"
const MOCK: RepuestoPortal[] = [
  { idProducto: 1, nombre: "Filtro de combustible", descripcion: "Para cargador 980H", marca: "Caterpillar", numeroParte: "1R-0750", idCategoria: 3, categoria: "Filtros", unidad: "Unidad", tipoRepuesto: "OEM", plazoEntrega: "5 a 7 días hábiles", urlImagen: null, precioReferencial: 568.75, moneda: "PEN" },
  { idProducto: 2, nombre: "Rodamiento rígido de bolas", descripcion: null, marca: "SKF", numeroParte: "6205-2RS", idCategoria: 5, categoria: "Rodamientos", unidad: "Unidad", tipoRepuesto: "ALTERNATIVO", plazoEntrega: "24 a 48 horas", urlImagen: null, precioReferencial: 48.5, moneda: "PEN" },
]

export const repuestosApi = {
  /** GET /api/portal/repuestos (solo CLIENTE, vitrina encendida). */
  async listar(q?: string): Promise<RepuestoPortal[]> {
    if (usarMock) {
      const t = q?.trim().toLowerCase()
      return MOCK.filter((r) => !t || r.nombre.toLowerCase().includes(t) || (r.numeroParte ?? "").toLowerCase().includes(t))
    }
    const { data } = await axiosClient.get<RepuestoPortal[]>("/portal/repuestos", { params: q ? { q } : undefined })
    return data
  },

  /** Carrito de cotización → una solicitud con todos los ítems (POST /api/solicitudes, canal VITRINA). */
  async pedirCotizacion(items: ItemCarrito[]): Promise<SolicitudCreadaResponse> {
    const body: SolicitudRequest = {
      canal: "VITRINA",
      asunto: items.length === 1 ? items[0].descripcion.slice(0, 150) : `Pedido de ${items.length} repuestos desde la vitrina`,
      items: items.map((i) => ({
        descripcion: i.descripcion.slice(0, 255),
        cantidad: i.cantidad,
        ...(i.unidad ? { unidad: i.unidad } : {}),
        ...(i.marca?.trim() ? { marcaTexto: i.marca.trim() } : {}),
        ...(i.numeroParte?.trim() ? { numeroParte: i.numeroParte.trim() } : {}),
        ...(i.urlFoto ? { urlFoto: i.urlFoto } : {}),
        ...(i.idProducto ? { idProducto: i.idProducto } : {}),
      })),
    }
    const { data } = await axiosClient.post<SolicitudCreadaResponse>(RUTA_SOLICITUDES, body)
    return data
  },
}
