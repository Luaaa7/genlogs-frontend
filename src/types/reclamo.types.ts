import type { PageResponse } from './common.types'

export const TipoReclamo = { RECLAMO: 'RECLAMO', INCIDENCIA: 'INCIDENCIA' } as const
export type TipoReclamo = (typeof TipoReclamo)[keyof typeof TipoReclamo]

export const EstadoReclamo = {
  REGISTRADO: 'REGISTRADO',
  EN_PROCESO: 'EN_PROCESO',
  RESUELTO: 'RESUELTO',
  CERRADO: 'CERRADO',
  ANULADO: 'ANULADO',
} as const
export type EstadoReclamo = (typeof EstadoReclamo)[keyof typeof EstadoReclamo]

export const PrioridadReclamo = { BAJA: 'BAJA', MEDIA: 'MEDIA', ALTA: 'ALTA', CRITICA: 'CRITICA' } as const
export type PrioridadReclamo = (typeof PrioridadReclamo)[keyof typeof PrioridadReclamo]

export interface SeguimientoReclamo {
  idSeguimientoReclamo: number
  estadoAnterior?: EstadoReclamo | null
  estadoNuevo: EstadoReclamo
  idUsuario?: number | null
  usuario?: string | null
  fechaEvento: string
  comentario?: string | null
}

export interface Reclamo {
  idReclamo: number
  codigoReclamo: string
  tipo: TipoReclamo
  estado: EstadoReclamo
  prioridad: PrioridadReclamo
  idCliente?: number | null
  cliente?: string | null
  idOrdenCompra?: number | null
  numeroOrdenCompra?: string | null
  idUsuarioResponsable?: number | null
  responsable?: string | null
  asunto: string
  descripcion: string
  fechaRegistro: string
  fechaLimite?: string | null
  fechaCierre?: string | null
  solucion?: string | null
  /** Pasó la fecha límite y sigue abierto. */
  vencido?: boolean
  /** Estados a los que puede pasar desde el actual. */
  siguientesEstados?: EstadoReclamo[]
  /** Solo en el detalle. */
  seguimientos?: SeguimientoReclamo[]
}

export interface ReclamoInput {
  tipo: TipoReclamo
  prioridad?: PrioridadReclamo
  idCliente?: number
  idOrdenCompra?: number
  idUsuarioResponsable?: number
  asunto: string
  descripcion: string
  fechaLimite?: string
}

export interface ReclamoFiltros {
  tipo?: TipoReclamo
  estado?: EstadoReclamo
  prioridad?: PrioridadReclamo
  idCliente?: number
  idResponsable?: number
  page?: number
  size?: number
}

export interface ResponsableReclamo {
  idUsuario: number
  nombres: string
}

export type ReclamosPage = PageResponse<Reclamo>
