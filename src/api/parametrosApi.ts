import { axiosClient } from './axiosClient'
import { RUTA_PARAMETROS, type ParametroSistema } from '@/api/contratos/parametros'

export async function listarParametros(): Promise<ParametroSistema[]> {
  const { data } = await axiosClient.get<ParametroSistema[]>(RUTA_PARAMETROS)
  return data
}

/** PUT /api/parametros/{clave} (RF-87, solo JEFE_ADMINISTRATIVO). El backend valida formato y orden. */
export async function actualizarParametro(clave: string, valor: string): Promise<ParametroSistema> {
  const { data } = await axiosClient.put<ParametroSistema>(`${RUTA_PARAMETROS}/${encodeURIComponent(clave)}`, { valor })
  return data
}

/** PUT /api/parametros/margenes-repuesto (D-17): los tres márgenes de repuestos juntos, todo o nada. */
export async function actualizarMargenesRepuesto(margenes: { min: number; porDefecto: number; max: number }): Promise<ParametroSistema[]> {
  const { data } = await axiosClient.put<ParametroSistema[]>(`${RUTA_PARAMETROS}/margenes-repuesto`, margenes)
  return data
}
