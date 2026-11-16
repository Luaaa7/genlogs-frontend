import { axiosClient } from '@/api/axiosClient'
import {
  RUTA_DESPACHOS,
  RUTA_DESPACHOS_PORTAL,
  rutaDespacho,
  rutaDespachoEtapa,
  rutaDespachoSst,
  type Despacho,
  type DespachoPortal,
  type EtapaCodigo,
  type TipoSst,
} from './despachoTipos'

export const despachosApi = {
  listar: async (): Promise<Despacho[]> => {
    const { data } = await axiosClient.get<Despacho[]>(RUTA_DESPACHOS)
    return data
  },
  obtener: async (id: number): Promise<Despacho> => {
    const { data } = await axiosClient.get<Despacho>(rutaDespacho(id))
    return data
  },
  crear: async (idOrdenCompra: number): Promise<Despacho> => {
    const { data } = await axiosClient.post<Despacho>(RUTA_DESPACHOS, { idOrdenCompra })
    return data
  },
  avanzar: async (id: number, etapa: EtapaCodigo): Promise<Despacho> => {
    const { data } = await axiosClient.patch<Despacho>(rutaDespachoEtapa(id), { etapa })
    return data
  },
  confirmarSst: async (id: number, cuerpo: { tipo: TipoSst; fechaVencimiento: string }): Promise<Despacho> => {
    const { data } = await axiosClient.post<Despacho>(rutaDespachoSst(id), cuerpo)
    return data
  },
  listarPortal: async (): Promise<DespachoPortal[]> => {
    const { data } = await axiosClient.get<DespachoPortal[]>(RUTA_DESPACHOS_PORTAL)
    return data
  },
}
