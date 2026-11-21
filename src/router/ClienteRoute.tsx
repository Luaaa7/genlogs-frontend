import { Navigate, Outlet, useLocation } from "react-router-dom"
import { rutaIngresoCliente } from "@/api/contratos/ingresoCliente"
import { RUTA_EMPRESA_PORTAL } from "@/api/contratos/ingresoGoogle"
import { PARAMETRO_VOLVER } from "@/api/contratos/registro"
import { leerSesionCliente, puedeEntrarAlPortal } from "@/lib/sesiones"

/**
 * Portal del cliente: solo con sesión de cliente y sin sesión interna abierta.
 * Sin sesión manda al ingreso del cliente con ?volver= para regresar a esta página.
 * Cuenta de Google sin empresa (v3.4): primero los datos de la empresa, también con ?volver=.
 */
export function ClienteRoute() {
  const location = useLocation()

  if (!puedeEntrarAlPortal()) {
    return <Navigate to={rutaIngresoCliente(`${location.pathname}${location.search}`)} replace />
  }

  if (leerSesionCliente()?.perfilCompleto === false && location.pathname !== RUTA_EMPRESA_PORTAL) {
    const volver = `${location.pathname}${location.search}`
    return <Navigate to={`${RUTA_EMPRESA_PORTAL}?${PARAMETRO_VOLVER}=${encodeURIComponent(volver)}`} replace />
  }

  return <Outlet />
}
