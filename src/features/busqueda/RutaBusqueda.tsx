import { Navigate, Outlet } from "react-router-dom"
import { usePermisos } from "@/lib/permisos"

/** Solo entran los roles con acceso a "busqueda" en permisos.ts (Gerente, Jefe Adm. y Asistente Logístico). */
export function RutaBusqueda() {
  const { puedeVer } = usePermisos()
  return puedeVer("busqueda") ? <Outlet /> : <Navigate to="/dashboard" replace />
}
