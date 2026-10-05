export const TipoDocumento = { DNI: 'DNI', RUC: 'RUC', CE: 'CE', PAS: 'PAS' } as const
export type TipoDocumento = (typeof TipoDocumento)[keyof typeof TipoDocumento]

/**
 * Forma que trae `tipoDocumento` cuando el backend serializa la entidad
 * `Tercero` completa (p. ej. anidada dentro de `Cliente`/`Proveedor` en sus
 * listados): es la relación @ManyToOne completa, no un string plano.
 */
export interface TipoDocumentoRef {
  idTipoDocumento?: number
  codigoTipo: string
  nombreTipo?: string
}

/** Lee el código ("RUC"/"DNI"/...) sea cual sea la forma en que llegó el campo. */
export function codigoTipoDocumento(valor: TipoDocumentoRef | string | null | undefined): string {
  if (!valor) return '—'
  return typeof valor === 'string' ? valor : valor.codigoTipo
}

/**
 * Forma de Tercero tal como viaja anidado dentro de la entidad Cliente/Proveedor
 * en GET /clientes y GET /proveedores (listados sin DTO): sus propias
 * relaciones (tipoDocumento, distrito) también vienen como objetos, no planas.
 */
export interface Tercero {
  idTercero: number
  numeroDocumento: string
  razonSocial: string
  direccion?: string | null
  telefono?: string | null
  correo?: string | null
  status: 'A' | 'I'
  tipoDocumento: TipoDocumentoRef | string
  nombreComercial: string | null
  email: string | null
}

export interface TerceroInput {
  idTipoDocumento: number
  idDistrito: number
  numeroDocumento: string
  razonSocial: string
  direccion?: string
  telefono?: string
  correo?: string
}

export interface ContactoTercero {
  idContacto: number
  id?: number
  idTercero: number
  nombres: string
  nombre?: string
  cargo?: string | null
  correo?: string | null
  email?: string | null
  telefono?: string | null
  esPrincipal: boolean
  principal?: boolean
  status: 'A' | 'I'
}

export type ContactoTerceroInput = { nombres?: string; nombre?: string; cargo?: string; correo?: string; email?: string; telefono?: string; esPrincipal?: boolean; principal?: boolean }
