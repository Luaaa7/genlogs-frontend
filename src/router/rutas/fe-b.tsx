import type { RutasBloque } from './tipos'
import { MisCotizacionesPage } from '@/features/portal-cliente/pages/MisCotizacionesPage'
import { CotizacionPortalDetallePage } from '@/features/portal-cliente/pages/CotizacionPortalDetallePage'

/** Rutas de FE-B - Portal del cliente (Luana). Solo este bloque edita este archivo. */
export const rutasFeB: RutasBloque = {
  internas: [],
  portal: [
    { path: '/portal/cotizaciones', element: <MisCotizacionesPage /> },
    { path: '/portal/cotizaciones/:id', element: <CotizacionPortalDetallePage /> },
  ],
  publicas: [],
}
