import { axiosClient } from './axiosClient'
import { RUTA_TIPO_CAMBIO, type TipoCambioDia } from '@/api/contratos/parametros'

/**
 * Tipo de cambio del dólar (RF-86, D-19) de BE-D: /api/tipo-cambio.
 * GET: todo el personal. PUT: solo JEFE_ADMINISTRATIVO corrige el de hoy (fuente MANUAL).
 */

/** Tipo de cambio de hoy (o el último guardado, con esDeHoy = false). null si nunca se guardó ninguno (404). */
export async function obtenerTipoCambio(): Promise<TipoCambioDia | null> {
  try {
    const { data } = await axiosClient.get<TipoCambioDia>(RUTA_TIPO_CAMBIO)
    return data
  } catch (error) {
    if ((error as { response?: { status?: number } })?.response?.status === 404) return null
    throw error
  }
}

/** Corrige el tipo de cambio de hoy: soles por 1 dólar, valor de venta, hasta 4 decimales. */
export async function corregirTipoCambio(valor: number): Promise<TipoCambioDia> {
  const { data } = await axiosClient.put<TipoCambioDia>(RUTA_TIPO_CAMBIO, { valor })
  return data
}
