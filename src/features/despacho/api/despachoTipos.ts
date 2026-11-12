import type { Origen } from '@/api/contratos'

/** No hay contrato de despacho en el Paso 0. Estas rutas son las de FE-5. */
export const RUTA_DESPACHOS = '/despachos'
export const rutaDespacho = (id: number) => `/despachos/${id}`
export const rutaDespachoAvanzar = (id: number) => `/despachos/${id}/avanzar`
export const rutaDespachoSalida = (id: number) => `/despachos/${id}/salida`
export const rutaDespachoPase = (id: number) => `/despachos/${id}/pase`
export const rutaDespachoSctr = (id: number) => `/despachos/${id}/sctr`

export const ORIGEN_NACIONAL = 'NACIONAL' satisfies Origen
export const ORIGEN_IMPORTADO = 'IMPORTADO' satisfies Origen

export interface EtapaDespacho {
  codigo: string
  nombre: string
}

export interface BloqueoSst {
  documento: 'PASE' | 'SCTR'
  situacion: 'FALTA' | 'VENCIDO'
}

export interface Despacho {
  id: number
  codigo: string
  origen: Origen
  /** Texto del backend. Nacional: «24–48 h». Importado: «5–7 días hábiles». */
  plazoEntrega: string
  etapas: EtapaDespacho[]
  etapaActual: string
  bloqueoSst: BloqueoSst | null
}

export function nombreOrigen(origen: Origen): string {
  return origen === ORIGEN_NACIONAL ? 'Nacional' : 'Importado'
}

export function nombreEtapaActual(despacho: Despacho): string {
  return despacho.etapas.find((etapa) => etapa.codigo === despacho.etapaActual)?.nombre ?? despacho.etapaActual
}

export function mensajeBloqueo(bloqueo: BloqueoSst | null): string | null {
  if (!bloqueo) return null
  if (bloqueo.documento === 'PASE') {
    return bloqueo.situacion === 'VENCIDO' ? 'El pase está vencido.' : 'Falta el pase.'
  }
  return bloqueo.situacion === 'VENCIDO' ? 'El SCTR está vencido.' : 'Falta el SCTR.'
}
