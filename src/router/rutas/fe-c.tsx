import { RoleGuard } from '@/router/RoleGuard'
import type { RutasBloque } from './tipos'
import { RutaSolicitudInterna } from '@/features/solicitudes/RutaSolicitudInterna'
import { SolicitudInternaPage } from '@/features/solicitudes/pages/SolicitudInternaPage'
import { SolicitudesListPage } from '@/features/solicitudes/pages/SolicitudesListPage'
import { ROLES_PANTALLA } from '@/features/solicitudes/lib/reglasSolicitud'
import { DespachoDetallePage } from '@/features/despacho/pages/DespachoDetallePage'
import { DespachosPage } from '@/features/despacho/pages/DespachosPage'
import { ROLES_DESPACHO } from '@/features/despacho/lib/reglasDespacho'

/** Rutas de FE-C. /solicitudes/:id no choca con /portal/solicitud ni con otra ruta interna. */
export const rutasFeC: RutasBloque = {
  internas: [
    {
      element: <RoleGuard allowedRoles={[...ROLES_PANTALLA]} />,
      children: [{
        element: <RutaSolicitudInterna />,
        children: [
          { path: '/solicitudes', element: <SolicitudesListPage /> },
          { path: '/solicitudes/:id', element: <SolicitudInternaPage /> },
        ],
      }],
    },
    {
      element: <RoleGuard allowedRoles={[...ROLES_DESPACHO]} />,
      children: [
        { path: '/despachos', element: <DespachosPage /> },
        { path: '/despachos/:id', element: <DespachoDetallePage /> },
      ],
    },
  ],
  portal: [],
  publicas: [],
}
