import { BookUser, Building2, IdCard, type LucideIcon } from 'lucide-react'

/** Ids de tipo_documento en la base de datos: 1 RUC, 2 DNI, 4 Pasaporte. */
export type TipoDocumentoId = 1 | 2 | 4

export interface TipoDocumentoInfo {
  id: TipoDocumentoId
  /** Nombre corto: "RUC", "DNI", "Pasaporte". */
  label: string
  /** Título de la sección cuando la pestaña está abierta. */
  titulo: string
  descripcion: string
  /** Formato del número, para el chip de la pestaña. */
  formato: string
  icono: LucideIcon
  /** Clases del cuadro del ícono (fondo y color del tipo). */
  iconoClass: string
  /** Color del borde superior de la pestaña abierta. */
  bordeClass: string
}

export const TIPOS_DOCUMENTO: readonly TipoDocumentoInfo[] = [
  {
    id: 1,
    label: 'RUC',
    titulo: 'Empresa con RUC',
    descripcion: 'Empresa o negocio · consulta SUNAT',
    formato: '11 dígitos',
    icono: Building2,
    iconoClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    bordeClass: 'border-t-blue-600',
  },
  {
    id: 2,
    label: 'DNI',
    titulo: 'Persona natural con DNI',
    descripcion: 'Persona natural · consulta RENIEC',
    formato: '8 dígitos',
    icono: IdCard,
    iconoClass: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
    bordeClass: 'border-t-teal-600',
  },
  {
    id: 4,
    label: 'Pasaporte',
    titulo: 'Cliente extranjero con pasaporte',
    descripcion: 'Cliente extranjero · registro manual',
    formato: '6 a 12',
    icono: BookUser,
    iconoClass: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
    bordeClass: 'border-t-orange-600',
  },
] as const

export function infoTipoDocumento(id: number | undefined): TipoDocumentoInfo {
  return TIPOS_DOCUMENTO.find((t) => t.id === id) ?? TIPOS_DOCUMENTO[0]
}
