import { axiosClient } from './axiosClient'

/** Resultado de consultar una tienda (ConsultaFuente del backend, BPMN 9-B.1). */
export type EstadoConsultaFuente =
  | 'OK'
  | 'SIN_RESULTADOS'
  | 'CON_ERROR'
  | 'BLOQUEADA'
  | 'REQUIERE_VERIFICACION'
  | 'OMITIDA_SESION'
  | 'OMITIDA_CUOTA'
  | 'NO_CONECTADO'

/** Una ficha leída en la tienda: los 6 campos (A4). El precio vacío llega como null, nunca 0. */
export interface FichaPrueba {
  titulo: string | null
  descripcion?: string | null
  precio: number | null
  codigoMoneda: string | null
  urlImagen: string | null
  urlReferencia: string | null
}

export interface ConsultaTienda {
  codigo: string
  estado: EstadoConsultaFuente
  motivo: string | null
  fichas: FichaPrueba[]
}

export interface ResultadoTienda {
  fuente: string
  acerto: boolean
  enlace?: string | null
}

export interface PedidoPrueba {
  pedido: string
  resultados: ResultadoTienda[]
}

export interface CorridaGuardada {
  codigo: string
  nombre: string
  corrida: number
  aciertos: number
  pedidos: number
  aprobada: boolean
  desactivada: boolean
}

export interface ResumenTienda {
  codigo: string
  nombre: string
  activa: boolean
  estado: string
  aciertos: number | null
  corrida: number
  aprobada: boolean
  detalle: { pedido: string; acerto: boolean; enlace: string | null; probadoEn: string }[]
}

/** M2 · Tabla de aciertos sobre 10: la última corrida de cada tienda (solo Jefe Administrativo). */
export async function resumenPrueba(): Promise<ResumenTienda[]> {
  const { data } = await axiosClient.get<ResumenTienda[]>('/fuentes/prueba')
  return data ?? []
}

/** M2 · Busca un pedido en las 5 tiendas sin guardar nada en el historial. */
export async function buscarPrueba(marca: string, numeroParte: string): Promise<ConsultaTienda[]> {
  const { data } = await axiosClient.post<ConsultaTienda[]>('/fuentes/prueba/buscar', { marca, numeroParte })
  return data ?? []
}

/** M2 · Guarda los 10 pedidos marcados; el backend deja los aciertos de cada tienda (D-37). */
export async function guardarCorrida(pedidos: PedidoPrueba[]): Promise<CorridaGuardada[]> {
  const { data } = await axiosClient.post<CorridaGuardada[]>('/fuentes/prueba/corridas', { pedidos })
  return data ?? []
}