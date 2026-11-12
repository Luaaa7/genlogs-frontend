import type { Rol } from '@/api/contratos'

/** Quién entra al detalle. puedeVer('cotizaciones') también deja pasar al cliente. */
export const ROLES_VER_COTIZACION = [
  'GERENTE_GENERAL',
  'JEFE_ADMINISTRATIVO',
  'ASISTENTE_LOGISTICO',
  'ASISTENTE_ADMINISTRATIVO',
] as const satisfies readonly Rol[]

export const ROL_ASISTENTE_LOGISTICO = 'ASISTENTE_LOGISTICO' satisfies Rol
export const ROL_JEFE_ADMINISTRATIVO = 'JEFE_ADMINISTRATIVO' satisfies Rol
export const ROL_GERENTE_GENERAL = 'GERENTE_GENERAL' satisfies Rol

const QUIEN_VE: readonly Rol[] = ROLES_VER_COTIZACION

export function veCotizaciones(rol: Rol | null): boolean {
  return rol !== null && QUIEN_VE.includes(rol)
}

export function esAsistenteLogistico(rol: Rol | null): boolean {
  return rol === ROL_ASISTENTE_LOGISTICO
}

export function esJefeAdministrativo(rol: Rol | null): boolean {
  return rol === ROL_JEFE_ADMINISTRATIVO
}
