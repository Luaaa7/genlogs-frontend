import { useAuthStore } from "@/features/auth/store/authStore"
import { haySesionInterna, leerSesionCliente } from "@/lib/sesiones"

/**
 * ¿Quien mira Ayuda es personal de GENLOGS con la sesión interna abierta? (v3.4)
 * Es la misma regla con la que AyudaLayout elige el marco del sistema: sesión interna,
 * token en memoria y ninguna sesión de cliente. Sin eso, la guía del personal no se muestra.
 */
export function useEsPersonalConSesion(): boolean {
  const tokenInterno = useAuthStore((s) => s.token)
  return haySesionInterna() && Boolean(tokenInterno) && leerSesionCliente() === null
}
