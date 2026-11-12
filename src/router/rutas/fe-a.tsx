import { RoleGuard } from '@/router/RoleGuard'
import { UsuariosPage } from '@/features/usuarios/components/UsuariosPage'
import { ConfiguracionIgvPage } from '@/features/configuracion/pages/ConfiguracionIgvPage'
import { ConfiguracionMargenesPage } from '@/features/configuracion/pages/ConfiguracionMargenesPage'
import type { RutasBloque } from './tipos'

/** Rutas de FE-A - Acceso, configuracion, ubicacion, feriados y avisos (Karla). Solo este bloque edita este archivo. */
export const rutasFeA: RutasBloque = {
  internas: [
    // /usuarios y /configuracion/* solo para JEFE_ADMINISTRATIVO (permisos.ts: esAdmin).
    {
      element: <RoleGuard permitido={(p) => p.esAdmin} />,
      children: [
        { path: '/usuarios', element: <UsuariosPage /> },
        { path: '/configuracion/igv', element: <ConfiguracionIgvPage /> },
        { path: '/configuracion/margenes', element: <ConfiguracionMargenesPage /> },
      ],
    },
  ],
  portal: [],
  publicas: [],
}
