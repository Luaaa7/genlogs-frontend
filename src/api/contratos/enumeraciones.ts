/**
 * Enumeraciones compartidas de la v3.2 (Paso 0). Mismos textos que el backend
 * (paquete com.genlogs.app.enums). Si cambias una, cambia tambien la del backend.
 */

export { ROLES, ROLES_INTERNOS, type Rol } from '@/lib/permisos'

export const ESTADOS_SOLICITUD = ['PENDIENTE', 'EN_REVISION', 'EN_ESPERA_TERCERO', 'COTIZADA', 'RECHAZADA', 'CANCELADA'] as const
export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number]

/** Plazo interno: COMUN 1 dia habil, IMPORTADO 3, ESPECIAL 5 (parametros PLAZO_*_DIAS). */
export const TIPOS_PLAZO = ['COMUN', 'IMPORTADO', 'ESPECIAL'] as const
export type TipoPlazo = (typeof TIPOS_PLAZO)[number]

export const TIPOS_EVENTO_SOLICITUD = ['CREADA', 'ESTADO', 'PAUSA', 'REANUDA', 'RECLASIFICA', 'REASIGNA', 'EDICION'] as const
export type TipoEventoSolicitud = (typeof TIPOS_EVENTO_SOLICITUD)[number]

/** Igual que EstadoCotizacion de src/types/cotizacion.types.ts. */
export const ESTADOS_COTIZACION = ['BORRADOR', 'ENVIADA', 'EN_NEGOCIACION', 'APROBADA', 'RECHAZADA', 'VENCIDA', 'ANULADA', 'PENDIENTE_APROBACION', 'APROBADA_INTERNA'] as const
export type CodigoEstadoCotizacion = (typeof ESTADOS_COTIZACION)[number]

export const ESTADOS_PUBLICACION = ['BORRADOR', 'PUBLICADO', 'OCULTO', 'RETIRADO'] as const
export type EstadoPublicacion = (typeof ESTADOS_PUBLICACION)[number]

/** Nacional: entrega en 24-48 h. Importado: 5-7 dias habiles. */
export const ORIGENES = ['NACIONAL', 'IMPORTADO'] as const
export type Origen = (typeof ORIGENES)[number]

/** "Original (OEM)" o "Alternativo compatible". */
export const TIPOS_REPUESTO = ['OEM', 'ALTERNATIVO'] as const
export type TipoRepuesto = (typeof TIPOS_REPUESTO)[number]

export const FUENTES_TIPO_CAMBIO = ['SUNAT', 'SBS', 'MANUAL'] as const
export type FuenteTipoCambio = (typeof FUENTES_TIPO_CAMBIO)[number]

export const CANALES_SOLICITUD = ['PORTAL', 'LANDING', 'VITRINA'] as const
export type CanalSolicitud = (typeof CANALES_SOLICITUD)[number]

export const TIPOS_AVISO = [
  'ALTO_VALOR',
  'PLAZO_POR_VENCER',
  'PLAZO_VENCIDO',
  'FACTURA_VENCIDA',
  'TIPO_CAMBIO',
  'DOCUMENTO_POR_VENCER',
  'MARGEN_FUERA_RANGO',
  'GENERAL',
] as const
export type TipoAviso = (typeof TIPOS_AVISO)[number]