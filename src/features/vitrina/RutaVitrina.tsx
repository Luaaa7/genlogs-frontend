import { Navigate, Outlet } from "react-router-dom"
import { usePermisos } from "@/lib/permisos"

/** Vitrina interna: personal con acceso al módulo "vitrina" en permisos.ts (no el cliente). */
export function RutaVitrina() {
  const { esInterno, puedeVer } = usePermisos()
  return esInterno && puedeVer("vitrina") ? <Outlet /> : <Navigate to="/dashboard" replace />
}
