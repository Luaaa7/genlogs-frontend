// src/types/solicitudWeb.types.ts

export const EstadoSolicitud = {
  PENDIENTE: 'PENDIENTE',
  EN_PROCESO: 'EN_PROCESO',
  COTIZACION_ENVIADA: 'COTIZACION_ENVIADA',
  COMPLETADA: 'COMPLETADA',
  RECHAZADA: 'RECHAZADA',
} as const;

export type EstadoSolicitud = (typeof EstadoSolicitud)[keyof typeof EstadoSolicitud];

export interface SolicitudWebDetalle {
  id?: number;
  solicitudId?: number;
  descripcion: string;
  cantidad?: number;
  especificaciones?: string;
}

export interface SolicitudWeb {
  id?: number;
  codigo: string;
  nombreContacto: string;
  email: string;
  telefono: string;
  empresaNombre?: string;
  ruc?: string;
  ciudadUbicacion: string;
  direccion?: string;
  descripcionNecesidad: string;
  presupuestoAproximado?: number;
  tiempoEntregaRequerido?: string;
  estadoSolicitud: EstadoSolicitud;
  fechaCreacion?: string;
  fechaModificacion?: string;
  detalles: SolicitudWebDetalle[];
  cotizacionAsociadaId?: number;
  observacionesInternas?: string;
}

export interface CreateSolicitudWebRequest {
  nombreContacto: string;
  email: string;
  telefono: string;
  empresaNombre?: string;
  ruc?: string;
  ciudadUbicacion: string;
  direccion?: string;
  descripcionNecesidad: string;
  presupuestoAproximado?: number;
  tiempoEntregaRequerido?: string;
  detalles: CreateSolicitudWebDetalleRequest[];
}

export interface CreateSolicitudWebDetalleRequest {
  descripcion: string;
  cantidad?: number;
  especificaciones?: string;
}

export interface SolicitudWebResponse {
  success: boolean;
  codigo?: string;
  mensaje: string;
  solicitudId?: number;
}
