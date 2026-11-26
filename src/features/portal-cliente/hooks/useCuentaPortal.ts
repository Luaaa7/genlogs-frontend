import { useQuery } from "@tanstack/react-query"
import { obtenerCuentaPortal } from "@/features/acceso-cliente/api/ingresoGoogleApi"
import { leerSesionCliente } from "@/lib/sesiones"

/** Datos de la cuenta del cliente (GET /portal/cuenta): correo y empresa. Solo se piden con sesión de cliente. */
export function useCuentaPortal() {
  return useQuery({
    queryKey: ["portal-cuenta"],
    queryFn: obtenerCuentaPortal,
    enabled: leerSesionCliente() !== null,
    staleTime: 5 * 60_000,
  })
}
