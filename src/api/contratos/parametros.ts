import type { FuenteTipoCambio } from './enumeraciones'

/**
 * Parametros del sistema (RF-87) y tipo de cambio (RF-86). En el Paso 0 el backend
 * los deja de solo lectura (ParametrosService.get, TipoCambioService.delDia);
 * los endpoints y pantallas los hacen BE-D / FE-A con estos tipos.
 * Rutas reservadas en SecurityConfig: /api/parametros/** y /api/tipo-cambio/**
 * (solo personal interno; edita JEFE_ADMINISTRATIVO).
 */
export const RUTA_PARAMETROS = '/parametros'
export const RUTA_TIPO_CAMBIO = '/tipo-cambio'

export const CLAVES_PARAMETRO = [
  'MONTO_ALTO_VALOR_PEN',
  'MARGEN_SERV_SUGERIDO',
  'MARGEN_SERV_MIN',
  'MARGEN_SERV_AVISO',
  'MARGEN_SERV_MAX',
  'PLAZO_COMUN_DIAS',
  'PLAZO_IMPORTADO_DIAS',
  'PLAZO_ESPECIAL_DIAS',
  'ALERTA_PLAZO_PCT',
  'VERIFICACION_DIAS',
  'OCULTAR_SIN_VERIF_DIAS',
  'OCULTAR_FALLAS',
] as const
export type ClaveParametro = (typeof CLAVES_PARAMETRO)[number]

export interface ParametroSistema {
  clave: ClaveParametro | string
  valor: string
  descripcion: string | null
  editadoEn: string
}

/** Igual que TipoCambioDia del backend. */
export interface TipoCambioDia {
  fecha: string
  codigoMoneda: string
  /** Soles por 1 unidad de la moneda (valor de venta, D-19). */
  valor: number
  fuente: FuenteTipoCambio
  /** false si hoy todavia no hay valor y se muestra el ultimo guardado. */
  esDeHoy: boolean
}