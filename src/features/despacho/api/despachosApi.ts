import { axiosClient } from '@/api/axiosClient'
import {
  ORIGEN_IMPORTADO,
  ORIGEN_NACIONAL,
  RUTA_DESPACHOS,
  rutaDespacho,
  rutaDespachoAvanzar,
  rutaDespachoPase,
  rutaDespachoSalida,
  rutaDespachoSctr,
  type BloqueoSst,
  type Despacho,
  type EtapaDespacho,
} from './despachoTipos'

let usarMock = false
usarMock = true // borra esta línea para la API real

const PREPARACION: EtapaDespacho = { codigo: 'PREPARACION', nombre: 'En preparación' }
const ADUANA: EtapaDespacho = { codigo: 'EN_ADUANA', nombre: 'En aduana' }
const LISTO: EtapaDespacho = { codigo: 'LISTO', nombre: 'Listo para salir' }

const NACIONALES: EtapaDespacho[] = [PREPARACION, LISTO]
const IMPORTADAS: EtapaDespacho[] = [PREPARACION, ADUANA, LISTO]

function despacho(parcial: Pick<Despacho, 'id' | 'codigo' | 'origen' | 'plazoEntrega' | 'etapas' | 'etapaActual'> & { bloqueoSst?: BloqueoSst | null }): Despacho {
  return { bloqueoSst: null, ...parcial, etapas: parcial.etapas.map((etapa) => ({ ...etapa })) }
}

const semilla = (): Despacho[] => [
  despacho({
    id: 1,
    codigo: 'DES-001',
    origen: ORIGEN_NACIONAL,
    plazoEntrega: '24–48 h',
    etapas: NACIONALES,
    etapaActual: 'PREPARACION',
  }),
  despacho({
    id: 2,
    codigo: 'DES-002',
    origen: ORIGEN_IMPORTADO,
    plazoEntrega: '5–7 días hábiles',
    etapas: IMPORTADAS,
    etapaActual: 'EN_ADUANA',
  }),
  despacho({
    id: 3,
    codigo: 'DES-003',
    origen: ORIGEN_IMPORTADO,
    plazoEntrega: '5–7 días hábiles',
    etapas: IMPORTADAS,
    etapaActual: 'EN_ADUANA',
    bloqueoSst: { documento: 'SCTR', situacion: 'VENCIDO' },
  }),
  despacho({
    id: 4,
    codigo: 'DES-004',
    origen: ORIGEN_IMPORTADO,
    plazoEntrega: '5–7 días hábiles',
    etapas: IMPORTADAS,
    etapaActual: 'EN_ADUANA',
    bloqueoSst: { documento: 'PASE', situacion: 'FALTA' },
  }),
]

const despachos = semilla()

function copia(despachoActual: Despacho): Despacho {
  return {
    ...despachoActual,
    etapas: despachoActual.etapas.map((etapa) => ({ ...etapa })),
    bloqueoSst: despachoActual.bloqueoSst ? { ...despachoActual.bloqueoSst } : null,
  }
}

function buscar(id: number): Despacho {
  const encontrado = despachos.find((item) => item.id === id)
  if (!encontrado) throw new Error('No existe el despacho')
  return encontrado
}

function errorBloqueo(bloqueo: BloqueoSst): Error {
  const detalle = bloqueo.documento === 'SCTR'
    ? (bloqueo.situacion === 'VENCIDO' ? 'el SCTR está vencido' : 'falta el SCTR')
    : (bloqueo.situacion === 'VENCIDO' ? 'el pase está vencido' : 'falta el pase')
  return new Error(`DESPACHO_BLOQUEADO_SST: ${detalle}`)
}

export const despachosApi = {
  listar: async (): Promise<Despacho[]> => {
    if (usarMock) return despachos.map(copia)
    const { data } = await axiosClient.get<Despacho[]>(RUTA_DESPACHOS)
    return data
  },
  obtener: async (id: number): Promise<Despacho> => {
    if (usarMock) return copia(buscar(id))
    const { data } = await axiosClient.get<Despacho>(rutaDespacho(id))
    return data
  },
  avanzar: async (id: number): Promise<Despacho> => {
    if (usarMock) {
      const actual = buscar(id)
      if (actual.bloqueoSst) throw errorBloqueo(actual.bloqueoSst)
      const indice = actual.etapas.findIndex((etapa) => etapa.codigo === actual.etapaActual)
      const siguiente = actual.etapas[indice + 1]
      if (siguiente) actual.etapaActual = siguiente.codigo
      return copia(actual)
    }
    const { data } = await axiosClient.post<Despacho>(rutaDespachoAvanzar(id))
    return data
  },
  darSalida: async (id: number): Promise<Despacho> => {
    if (usarMock) {
      const actual = buscar(id)
      if (actual.bloqueoSst) throw errorBloqueo(actual.bloqueoSst)
      return copia(actual)
    }
    const { data } = await axiosClient.post<Despacho>(rutaDespachoSalida(id))
    return data
  },
  confirmarPase: async (id: number): Promise<Despacho> => {
    if (usarMock) {
      const actual = buscar(id)
      if (actual.bloqueoSst?.documento === 'PASE') actual.bloqueoSst = null
      return copia(actual)
    }
    const { data } = await axiosClient.post<Despacho>(rutaDespachoPase(id))
    return data
  },
  confirmarSctr: async (id: number): Promise<Despacho> => {
    if (usarMock) {
      const actual = buscar(id)
      if (actual.bloqueoSst?.documento === 'SCTR') actual.bloqueoSst = null
      return copia(actual)
    }
    const { data } = await axiosClient.post<Despacho>(rutaDespachoSctr(id))
    return data
  },
}
