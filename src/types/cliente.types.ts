import type { Tercero, TerceroInput } from './tercero.types'

/**
 * GET /clientes devuelve la entidad JPA `Cliente` tal cual (ClienteController
 * no la mapea a un DTO para el listado), así que `tercero` viene anidado con
 * sus propias relaciones también anidadas (p. ej. `tipoDocumento` es un
 * objeto {codigoTipo, nombreTipo, ...}, no un string "RUC"/"DNI").
 * Usa `codigoTipoDocumento()` de tercero.types para leerlo de forma segura.
 */
export interface Cliente {
  idCliente: number
  /** Alias de lectura para componentes antiguos; el ID canónico es idCliente. */
  id: number
  tercero: Tercero
  situacion: string
  status: 'A' | 'I'
}

/**
 * GET /clientes/{id} SÍ pasa por un DTO (`ClienteResponse`): plano, sin
 * `tercero` anidado ni `contactos`/`empresasMineras` embebidos. Esos dos
 * últimos se piden aparte (ver useContactosTercero y
 * useEmpresaMineraPorCliente).
 */
export interface ClienteDetalle {
  idCliente: number
  idTercero: number
  tipoDocumento: string
  numeroDocumento: string
  razonSocial: string
  direccion?: string | null
  telefono?: string | null
  correo?: string | null
  sectorEconomico?: string | null
  situacion: string
  esTambienProveedor: boolean
}

export interface ClienteInput {
  tercero: TerceroInput
  idSectorEconomico: number
  situacion?: string
}
export type ClienteRequest = ClienteInput
export interface FiltrosCliente { documento?: string; razonSocial?: string; idSectorEconomico?: number; situacion?: string; page?: number; size?: number }
