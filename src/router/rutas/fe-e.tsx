import { RoleGuard } from '@/router/RoleGuard'
import type { RutasBloque } from './tipos'
import { AccionesPage } from '@/features/acciones/pages/AccionesPage'
import { AlertasDocumentosPage } from '@/features/alertas-documentos/pages/AlertasDocumentosPage'
import { ROLES_ALERTAS_DOCUMENTOS } from '@/features/alertas-documentos/lib/alertas'

/** Quienes pueden ver el dashboard: Gerente, Jefe, Contador y asistente logístico. */
const ROLES_ACCIONES = ['GERENTE_GENERAL', 'JEFE_ADMINISTRATIVO', 'CONTADOR_GENERAL', 'ASISTENTE_LOGISTICO']

/** Rutas de FE-E - Finanzas, servicios y dashboard (Mell). Solo este bloque edita este archivo. */
export const rutasFeE: RutasBloque = {
  internas: [
    {
      element: <RoleGuard allowedRoles={[...ROLES_ACCIONES]} />,
      children: [{ path: '/acciones', element: <AccionesPage /> }],
    },
    {
      element: <RoleGuard allowedRoles={[...ROLES_ALERTAS_DOCUMENTOS]} />,
      children: [{ path: '/alertas-documentos', element: <AlertasDocumentosPage /> }],
    },
  ],
  portal: [],
  publicas: [],
}
