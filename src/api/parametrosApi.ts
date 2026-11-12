import { axiosClient } from './axiosClient'
import { RUTA_PARAMETROS, type ParametroSistema } from '@/api/contratos/parametros'

export async function listarParametros(): Promise<ParametroSistema[]> {
  const { data } = await axiosClient.get<ParametroSistema[]>(RUTA_PARAMETROS)
  return data
}
