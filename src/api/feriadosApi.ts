import { axiosClient } from './axiosClient'

/**
 * Feriados (D-18) de BE-B: /api/feriados. Los plazos en días hábiles no cuentan
 * estas fechas. Ver: todo el personal. Agregar y quitar: JEFE_ADMINISTRATIVO,
 * y solo fechas futuras (una que ya pasó se usó para calcular plazos).
 */
export const RUTA_FERIADOS = '/feriados'

export interface Feriado {
  idFeriado: number
  /** AAAA-MM-DD */
  fecha: string
  descripcion: string
}

export interface FeriadoRequest {
  fecha: string
  descripcion: string
}

/** Feriados activos desde una fecha (por defecto, hoy). */
export async function listarFeriados(desde?: string): Promise<Feriado[]> {
  const { data } = await axiosClient.get<Feriado[]>(RUTA_FERIADOS, { params: desde ? { desde } : undefined })
  return Array.isArray(data) ? data : []
}

export async function crearFeriado(feriado: FeriadoRequest): Promise<Feriado> {
  const { data } = await axiosClient.post<Feriado>(RUTA_FERIADOS, feriado)
  return data
}

/** Baja lógica (D-29): el feriado deja de contar, pero queda en la base. */
export async function quitarFeriado(idFeriado: number): Promise<void> {
  await axiosClient.patch(`${RUTA_FERIADOS}/${idFeriado}/baja`)
}
