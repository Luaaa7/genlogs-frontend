import { axiosClient } from './axiosClient'

export interface FuenteConfig {
  codigo: string
  nombre: string
  urlBase: string
  activa: boolean
  estado: 'SIN_PROBAR' | 'ACTIVA' | 'CON_ERROR' | 'REQUIERE_VERIFICACION'
  sesionValidaHasta: string | null
  ultimaPrueba: string | null
  ultimoError: string | null
  pausaSegundos: number
  limiteDiario: number
  aciertosPrueba: number | null
  tieneUsuario: boolean
  tieneClave: boolean
}

/** Configuración > Fuentes de búsqueda (L5 y L1, backend /api/fuentes). Nunca devuelve usuario, clave ni sesión. */
export async function listarFuentes(): Promise<FuenteConfig[]> {
  const { data } = await axiosClient.get<FuenteConfig[]>('/fuentes')
  return data ?? []
}

/** Solo escritura: el backend cifra la cuenta y la fuente vuelve a «Sin probar». */
export async function guardarCredenciales(codigo: string, cuenta: { usuario?: string; clave?: string }): Promise<void> {
  await axiosClient.put(`/fuentes/${codigo}/credenciales`, cuenta)
}

/** L1: el servicio de lectura intenta iniciar sesión con la cuenta de búsqueda. */
export async function probarSesion(codigo: string): Promise<FuenteConfig> {
  const { data } = await axiosClient.post<FuenteConfig>(`/fuentes/${codigo}/probar`)
  return data
}

/** Encender o apagar la tienda en la búsqueda (D-37: con sesión activa y 4 o más aciertos de 10). */
export async function activarFuente(codigo: string, activa: boolean): Promise<FuenteConfig> {
  const { data } = await axiosClient.patch<FuenteConfig>(`/fuentes/${codigo}/activar`, { activa })
  return data
}

export async function cambiarParametros(codigo: string, p: { pausaSegundos: number; limiteDiario: number }): Promise<FuenteConfig> {
  const { data } = await axiosClient.patch<FuenteConfig>(`/fuentes/${codigo}/parametros`, p)
  return data
}
