import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/authStore"
import { normalizarRol, permisosDe, type Permisos, type Rol } from "@/lib/permisos"

interface RoleGuardProps {
  /**
   * Regla de acceso con permisos.ts (recomendado), por ejemplo
   * `permitido={(p) => p.esAdmin}` o `permitido={(p) => p.puedeVer('reclamos')}`.
   */
  permitido?: (permisos: Permisos) => boolean
  /**
   * Alternativa: lista de roles. Acepta texto simple (como lo usan rutas/fe-c.tsx y fe-e.tsx);
   * cada nombre se normaliza con permisos.ts, así los viejos (ADMINISTRADOR, VENDEDOR) también sirven.
   */
  allowedRoles?: readonly string[]
  children?: React.ReactNode
}

/**
 * Deja pasar solo a quien cumple la regla; al resto lo manda al dashboard.
 * El rol sale del store de auth y se normaliza con permisos.ts, así un
 * ADMINISTRADOR de la base sin migrar cuenta como JEFE_ADMINISTRATIVO.
 * Solo oculta pantallas: quien bloquea de verdad es el backend.
 */
export function RoleGuard({ permitido, allowedRoles, children }: RoleGuardProps) {
  const location = useLocation()
  const nombreRol = useAuthStore((state) => state.nombreRol)
  const permisos = permisosDe(nombreRol)
  const rol = normalizarRol(nombreRol)

  const pasaPermiso = permitido ? permitido(permisos) : true
  const rolesPermitidos = allowedRoles?.map(normalizarRol).filter((r): r is Rol => r !== null)
  const pasaRol = rolesPermitidos ? rol !== null && rolesPermitidos.includes(rol) : true
  // Sin ninguna regla no se deja pasar a nadie: un guard vacío es un error de configuración.
  const tieneRegla = permitido !== undefined || allowedRoles !== undefined

  if (!tieneRegla || !pasaPermiso || !pasaRol) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
