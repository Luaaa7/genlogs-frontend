import { Navigate, Outlet, useLocation } from "react-router-dom"
import { rutaIngresoCliente } from "@/api/contratos/ingresoCliente"
import { puedeEntrarAlPortal } from "@/lib/sesiones"

/**
 * Portal del cliente: solo con sesión de cliente y sin sesión interna abierta.
 * Sin sesión manda al ingreso del cliente con ?volver= para regresar a esta página.
 */
export function ClienteRoute() {
  const location = useLocation()

  if (!puedeEntrarAlPortal()) {
    return <Navigate to={rutaIngresoCliente(`${location.pathname}${location.search}`)} replace />
  }

  return <Outlet />
}
