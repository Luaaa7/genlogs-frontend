// src/types/cotizacion.types.ts
// EstadoCotizacion
export const EstadoCotizacion = {
  BORRADOR: 'BORRADOR',
  ENVIADA: 'ENVIADA',
  APROBADA: 'APROBADA',
  RECHAZADA: 'RECHAZADA',
  CADUCADA: 'CADUCADA', 
} as const;

export type EstadoCotizacion = (typeof EstadoCotizacion)[keyof typeof EstadoCotizacion];

// CondicionPago
export const CondicionPago = {
  CONTADO: 'CONTADO',
  CREDITO_30: 'CREDITO_30',
  CREDITO_60: 'CREDITO_60',
} as const;

export type CondicionPago = (typeof CondicionPago)[keyof typeof CondicionPago];

// Moneda
export const Moneda = {
  PEN: 'PEN',
  USD: 'USD',
  EUR: 'EUR',
} as const;

export type Moneda = (typeof Moneda)[keyof typeof Moneda];

export interface CotizacionDetalle {
  id?: number;
  cotizacionId?: number;
  producto?: string;
  servicio?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  margenPorcentaje: number;
  descripcion?: string;
}

export interface AdjuntoCotizacion {
  id?: number;
  cotizacionId?: number;
  nombreArchivo: string;
  urlCloudinary: string;
  tipoArchivo: string;
  tamanio: number;
  fechaSubida?: string;
  subidoPor?: string;
}

export interface SeguimientoCotizacion {
  id?: number;
  cotizacionId?: number;
  estadoAnterior: EstadoCotizacion;
  estadoNuevo: EstadoCotizacion;
  fecha: string;
  usuarioId?: number;
  usuarioNombre?: string;
  observaciones?: string;
}

export interface Cotizacion {
  id?: number;
  codigo: string;
  clienteId: number;
  clienteNombre?: string;
  clienteEmail?: string;
  condicionPago: CondicionPago;
  moneda: Moneda;
  subtotal: number;
  igv: number;
  total: number;
  estadoCotizacion: EstadoCotizacion;
  fechaCreacion?: string;
  fechaModificacion?: string;
  fechaVencimiento?: string;
  observaciones?: string;
  detalles: CotizacionDetalle[];
  seguimientos?: SeguimientoCotizacion[];
  adjuntos?: AdjuntoCotizacion[];
}

export interface CreateCotizacionRequest {
  clienteId: number;
  condicionPago: CondicionPago;
  moneda: Moneda;
  observaciones?: string;
  detalles: CreateCotizacionDetalleRequest[];
}

export interface CreateCotizacionDetalleRequest {
  producto?: string;
  servicio?: string;
  cantidad: number;
  precioUnitario: number;
  margenPorcentaje: number;
  descripcion?: string;
}

export interface UpdateEstadoCotizacionRequest {
  estadoNuevo: EstadoCotizacion;
  observaciones?: string;
}

export interface CotizacionesListResponse {
  content: Cotizacion[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface CotizacionesFilterParams {
  estadoCotizacion?: EstadoCotizacion;
  clienteId?: number;
  moneda?: Moneda;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export interface EnviarCotizacionRequest {
  correoDestinatario: string;
  asunto: string;
  mensaje: string;
  incluirDetalles: boolean;
}
