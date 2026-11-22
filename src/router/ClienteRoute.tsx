import { Navigate, Outlet, useLocation } from "react-router-dom"
import { rutaIngresoCliente } from "@/api/contratos/ingresoCliente"
import { RUTA_EMPRESA_PORTAL } from "@/api/contratos/ingresoGoogle"
import { PARAMETRO_VOLVER } from "@/api/contratos/registro"
import { leerSesionCliente, puedeEntrarAlPortal } from "@/lib/sesiones"
import { PortalSinEmpresa } from "@/features/acceso-cliente/components/PortalSinEmpresa"

const RUTA_SOLICITUD_PORTAL = "/portal/solicitud"

/**
 * Portal del cliente: solo con sesión de cliente y sin sesión interna abierta.
 * Sin sesión manda al ingreso del cliente con ?volver= para regresar a esta página.
 * Cuenta de Google sin empresa (v3.4): puede entrar y recorrer el portal; los datos de la
 * empresa se le piden recién al pedir una cotización (/portal/solicitud), con ?volver=.
 */
export function ClienteRoute() {
  const location = useLocation()

  if (!puedeEntrarAlPortal()) {
    return <Navigate to={rutaIngresoCliente(`${location.pathname}${location.search}`)} replace />
  }

  if (leerSesionCliente()?.perfilCompleto === false && location.pathname !== RUTA_EMPRESA_PORTAL) {
    // Pedir una cotización necesita la empresa (RUC): ahí se piden los datos y luego vuelve.
    if (location.pathname === RUTA_SOLICITUD_PORTAL) {
      const volver = `${location.pathname}${location.search}`
      return <Navigate to={`${RUTA_EMPRESA_PORTAL}?${PARAMETRO_VOLVER}=${encodeURIComponent(volver)}`} replace />
    }
    // El resto del portal se recorre libremente; sin empresa todavía no hay nada que mostrar.
    return <PortalSinEmpresa />
  }

  return <Outlet />
}
