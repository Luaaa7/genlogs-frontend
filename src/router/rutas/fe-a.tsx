import { RoleGuard } from '@/router/RoleGuard'
import { ParametrosPage } from '@/features/parametros/pages/ParametrosPage'
import type { RutasBloque } from './tipos'

/** Rutas de FE-A - Acceso, configuracion, ubicacion, feriados y avisos (Karla). Solo este bloque edita este archivo. */
export const rutasFeA: RutasBloque = {
  internas: [
    // RF-87: parámetros del sistema, solo JEFE_ADMINISTRATIVO (ADMINISTRADOR = base sin migrar).
    {
      element: <RoleGuard allowedRoles={['JEFE_ADMINISTRATIVO', 'ADMINISTRADOR']} />,
      children: [{ path: '/configuracion/parametros', element: <ParametrosPage /> }],
    },
  ],
  portal: [],
  publicas: [],
}
