import { useQuery } from "@tanstack/react-query"
import { obtenerCuentaPortal } from "@/features/acceso-cliente/api/ingresoGoogleApi"
import { leerSesionCliente } from "@/lib/sesiones"

export const CLAVE_CUENTA_PORTAL = ["portal-cuenta"] as const

/** Datos de la cuenta del cliente (GET /portal/cuenta): correo y empresa. Solo se piden con sesión de cliente. */
export function useCuentaPortal() {
  return useQuery({
    queryKey: CLAVE_CUENTA_PORTAL,
    queryFn: obtenerCuentaPortal,
    enabled: leerSesionCliente() !== null,
    staleTime: 5 * 60_000,
  })
}
