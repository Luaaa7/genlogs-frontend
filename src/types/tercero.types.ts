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
  /** DNI y pasaporte: nombres y apellidos por separado (null en RUC y en registros antiguos). */
  nombres?: string | null
  apellidoPaterno?: string | null
  apellidoMaterno?: string | null
  direccion?: string | null
  telefono?: string | null
  correo?: string | null
  status: 'A' | 'I'
  tipoDocumento: TipoDocumentoRef | string
  /** Viene anidado cuando el backend serializa la entidad (puede faltar). */
  distrito?: { idDistrito?: number } | null
  /** D-15: país (null en datos viejos = Perú) y ubicación en texto si no es Perú. */
  pais?: { idPais?: number } | null
  regionExtranjero?: string | null
  ciudadExtranjero?: string | null
  codigoPostalExtranjero?: string | null
  nombreComercial: string | null
  email: string | null
}

export interface TerceroInput {
  idTipoDocumento: number
  /** Obligatorio solo si el país es Perú (D-15). */
  idDistrito?: number
  /** Sin valor = Perú. */
  idPais?: number
  regionExtranjero?: string
  ciudadExtranjero?: string
  codigoPostalExtranjero?: string
  numeroDocumento: string
  /** Razón social (RUC) o nombre completo (DNI y pasaporte). */
  razonSocial: string
  nombres?: string
  apellidoPaterno?: string
  apellidoMaterno?: string
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