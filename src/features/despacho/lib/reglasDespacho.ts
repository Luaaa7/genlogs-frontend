import type { Rol } from '@/api/contratos'

/** Quién entra a la ruta. puedeVer('despacho') también deja pasar al cliente. */
export const ROLES_DESPACHO = [
  'GERENTE_GENERAL',
  'JEFE_ADMINISTRATIVO',
  'ASISTENTE_LOGISTICO',
  'ASISTENTE_ADMINISTRATIVO',
  'SUPERVISOR_SST',
] as const satisfies readonly Rol[]
