import { Navigate, Outlet } from 'react-router-dom'
import { usePermisos } from '@/lib/permisos'
import { entraALaPantalla } from './lib/reglasSolicitud'

/** Segunda barrera, con permisosDe(). RoleGuard ya filtró el nombre de rol en la ruta. */
export function RutaSolicitudInterna() {
  const { rol } = usePermisos()
  return entraALaPantalla(rol) ? <Outlet /> : <Navigate to="/dashboard" replace />
}
