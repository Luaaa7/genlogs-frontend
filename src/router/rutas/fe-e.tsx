import { RoleGuard } from '@/router/RoleGuard'
import type { RutasBloque } from './tipos'
import { AccionesPage } from '@/features/acciones/pages/AccionesPage'

/** Quienes pueden ver el dashboard: Gerente, Jefe, Contador y asistente logístico. */
const ROLES_ACCIONES = ['GERENTE_GENERAL', 'JEFE_ADMINISTRATIVO', 'CONTADOR_GENERAL', 'ASISTENTE_LOGISTICO']

/** Rutas de FE-E - Finanzas, servicios y dashboard (Mell). Solo este bloque edita este archivo. */
export const rutasFeE: RutasBloque = {
  internas: [
    {
      element: <RoleGuard allowedRoles={[...ROLES_ACCIONES]} />,
      children: [{ path: '/acciones', element: <AccionesPage /> }],
    },
  ],
  portal: [],
  publicas: [],
}
