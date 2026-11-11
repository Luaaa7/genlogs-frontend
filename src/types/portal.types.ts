export type EstadoPedido = "PENDIENTE" | "EN_PROCESO" | "ATENDIDO" | "CANCELADO"

export interface ProductoPublico {
  id: number | string
  nombre: string
  descripcion?: string | null
  categoria?: string | null
  unidad?: string | null
  imagenUrl?: string | null
}

export interface CoberturaMinera {
  id: number | string
  nombre: string
  region?: string | null
  descripcion?: string | null
}

export interface Pedido {
  id: number | string
  codigo?: string | null
  fecha: string
  estado: EstadoPedido | string
  asunto?: string | null
  descripcion?: string | null
  total?: number | null
  items?: PedidoItem[]
}

export interface PedidoItem {
  id?: number | string
  descripcion: string
  cantidad: number
  unidad?: string | null
}

export interface RegistroClienteRequest {
  razonSocial: string
  documento: string
  nombreContacto: string
  correo: string
  telefono?: string
  password: string
}

export interface RegistroClienteResponse {
  mensaje?: string
  token?: string
  nombre?: string
  nombreUsuario?: string
}

/** Repuesto del pedido (D-01): marca y N.º de parte si los tiene; si no, foto o plano. */
export interface SolicitudItemRequest {
  descripcion: string
  cantidad: number
  unidad?: string | null
  marcaTexto?: string | null
  numeroParte?: string | null
  gtin?: string | null
  urlFoto?: string | null
}

export interface CrearSolicitudRequest {
  asunto: string
  descripcion: string
  items?: SolicitudItemRequest[]
}

export interface CrearSolicitudResponse {
  id: number | string
  mensaje?: string
}

export interface ListaPedidosResponse {
  content?: Pedido[]
  pedidos?: Pedido[]
  total?: number
}
