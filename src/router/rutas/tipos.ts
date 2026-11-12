import type { RouteObject } from 'react-router-dom'

/**
 * Rutas de un bloque (Paso 0). Cada bloque agrega las suyas SOLO en su archivo
 * fe-x.tsx; router/index.tsx las reparte en el layout que corresponde.
 *  - internas: dentro del sistema interno (AppLayout, con sesion).
 *  - portal:   dentro del portal del cliente (ClienteLayout, con sesion de cliente).
 *  - publicas: sin sesion (PublicLayout: landing y vitrina publica).
 * Para limitar por rol, envuelve las rutas en <RoleGuard> o usa permisos.ts.
 */
export interface RutasBloque {
  internas: RouteObject[]
  portal: RouteObject[]
  publicas: RouteObject[]
}