import type { RutasBloque } from './tipos'
import { RoleGuard } from '@/router/RoleGuard'
import { FuentesBusquedaPage } from '@/features/fuentes-busqueda/pages/FuentesBusquedaPage'
import { MisCotizacionesPage } from '@/features/portal-cliente/pages/MisCotizacionesPage'
import { CotizacionPortalDetallePage } from '@/features/portal-cliente/pages/CotizacionPortalDetallePage'
import { MisReclamosPage } from '@/features/portal-cliente/pages/MisReclamosPage'
import { ReclamoPortalDetallePage } from '@/features/portal-cliente/pages/ReclamoPortalDetallePage'

/** Rutas de FE-B - Portal del cliente y fuentes de búsqueda (Luana). Solo este bloque edita este archivo. */
export const rutasFeB: RutasBloque = {
  internas: [
    // L3 (v3.3, BPMN 9-A): Jefe Administrativo y Asistente Logístico (permisos.ts: verFuentes).
    {
      element: <RoleGuard permitido={(p) => p.verFuentes} />,
      children: [{ path: '/configuracion/fuentes', element: <FuentesBusquedaPage /> }],
    },
  ],
  portal: [
    { path: '/portal/cotizaciones', element: <MisCotizacionesPage /> },
    { path: '/portal/cotizaciones/:id', element: <CotizacionPortalDetallePage /> },
    { path: '/portal/reclamos', element: <MisReclamosPage /> },
    { path: '/portal/reclamos/:id', element: <ReclamoPortalDetallePage /> },
  ],
  publicas: [],
}
