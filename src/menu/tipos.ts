import type { ElementType } from 'react'
import type { Permisos } from '@/lib/permisos'

/** Grupo del menu lateral interno donde aparece la opcion. 'Portal' es para el menu del portal del cliente. */
export type GrupoMenu = 'Operación' | 'Maestros' | 'Administración' | 'Portal'

/**
 * Opcion de menu de un bloque (Paso 0). Ejemplo:
 *   { grupo: 'Operación', label: 'Solicitudes', path: '/solicitudes', icon: Inbox,
 *     visible: (p) => p.puedeVer('solicitudes') }
 */
export interface ItemMenu {
  grupo: GrupoMenu
  label: string
  path: string
  icon: ElementType
  /** Si no se indica, la ve todo el personal interno. Usa permisos.ts, nunca nombres de rol sueltos. */
  visible?: (permisos: Permisos) => boolean
}