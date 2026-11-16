import type { Origen } from '@/api/contratos'
import { formatearFechaCorta } from '@/lib/formatters/fechaLocal'

export const RUTA_DESPACHOS = '/despachos'
export const RUTA_DESPACHOS_PORTAL = '/portal/despachos'
export const rutaDespacho = (id: number) => `/despachos/${id}`
export const rutaDespachoEtapa = (id: number) => `/despachos/${id}/etapa`
export const rutaDespachoSst = (id: number) => `/despachos/${id}/sst`

export const ORIGEN_NACIONAL = 'NACIONAL' satisfies Origen
export const ORIGEN_IMPORTADO = 'IMPORTADO' satisfies Origen

export const ETAPAS = ['REGISTRADO', 'EN_PREPARACION', 'EN_ADUANA', 'EN_TRANSITO', 'ENTREGADO'] as const
export type EtapaCodigo = (typeof ETAPAS)[number]
export type TipoSst = 'PASE' | 'SCTR'

export interface DocumentoSst {
  vigente: boolean
  vencimiento: string | null
  referencia: string | null
}

export interface SstDespacho {
  bloqueaAvance: boolean
  mensaje: string | null
  pase?: DocumentoSst | null
  sctr?: DocumentoSst | null
}

/** Respuesta interna de GET /api/despachos. */
export interface Despacho {
  idDespacho: number
  idOrdenCompra: number
  numeroOrdenCompra: string
  idCotizacion?: number
  origen: Origen
  etapa: EtapaCodigo
  etapaNombre: string
  plazoDesde: string | null
  plazoHasta: string | null
  origenIncompleto: boolean
  sst: SstDespacho | null
}

/** Lo que ve el cliente. Sin SST, origen incompleto ni usuarios. */
export interface DespachoPortal {
  id: number
  etapa: EtapaCodigo
  etapaNombre: string
  plazoDesde: string | null
  plazoHasta: string | null
  numeroOrdenCompra: string
}

const NOMBRE_ETAPA: Record<EtapaCodigo, string> = {
  REGISTRADO: 'Registrado',
  EN_PREPARACION: 'En preparación',
  EN_ADUANA: 'En aduana',
  EN_TRANSITO: 'En tránsito',
  ENTREGADO: 'Entregado',
}

export function nombreOrigen(origen: Origen): string {
  return origen === ORIGEN_NACIONAL ? 'Nacional' : 'Importado'
}

export function nombreEtapa(codigo: EtapaCodigo): string {
  return NOMBRE_ETAPA[codigo]
}

/** La etapa que sigue. Un nacional no pasa por aduana. */
export function siguienteEtapa(etapa: EtapaCodigo, origen: Origen): EtapaCodigo | null {
  switch (etapa) {
    case 'REGISTRADO': return 'EN_PREPARACION'
    case 'EN_PREPARACION': return origen === ORIGEN_IMPORTADO ? 'EN_ADUANA' : 'EN_TRANSITO'
    case 'EN_ADUANA': return 'EN_TRANSITO'
    case 'EN_TRANSITO': return 'ENTREGADO'
    case 'ENTREGADO': return null
  }
}

/** Plazo tal como llega: desde y hasta. No se calcula en la pantalla. */
export function textoPlazo(desde: string | null, hasta: string | null): string {
  const inicio = formatearFechaCorta(desde, '')
  const fin = formatearFechaCorta(hasta, '')
  if (inicio && fin) return `${inicio} – ${fin}`
  return inicio || fin || '—'
}
