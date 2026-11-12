import { RoleGuard } from '@/router/RoleGuard'
import { ParametrosPage } from '@/features/parametros/pages/ParametrosPage'
import { TipoCambioPage } from '@/features/tipo-cambio/pages/TipoCambioPage'
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
    // RF-87: parámetros del sistema, solo JEFE_ADMINISTRATIVO (permisos.ts: editarParametros).
    {
      element: <RoleGuard permitido={(p) => p.editarParametros} />,
      children: [{ path: '/configuracion/parametros', element: <ParametrosPage /> }],
    },
    // RF-86: tipo de cambio del día, solo JEFE_ADMINISTRATIVO (permisos.ts: editarTipoCambio).
    {
      element: <RoleGuard permitido={(p) => p.editarTipoCambio} />,
      children: [{ path: '/configuracion/tipo-cambio', element: <TipoCambioPage /> }],
    },
  ],
  portal: [],
  publicas: [],
}