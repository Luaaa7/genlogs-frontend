import { useLocation } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/authStore"
import { haySesionInterna, leerSesionCliente, puedeEntrarAlPortal } from "@/lib/sesiones"
import { AppLayout } from "@/layouts/AppLayout"
import { ClienteLayout } from "@/layouts/ClienteLayout"
import { PublicLayout } from "@/layouts/PublicLayout"

/**
 * Marco de Ayuda y Contáctame (v3.4, K2). Son páginas públicas, pero quien ya tiene
 * sesión las ve dentro de su propio sistema, sin salir a la cabecera de la landing:
 *  - personal interno → AppLayout (menú lateral y barra superior);
 *  - cliente del portal → ClienteLayout;
 *  - visitante → PublicLayout.
 * La sesión se vuelve a leer en cada cambio de ruta (al ingresar o cerrar sesión).
 */
export function AyudaLayout() {
  useLocation()
  const tokenInterno = useAuthStore((s) => s.token)

  if (haySesionInterna() && tokenInterno && leerSesionCliente() === null) return <AppLayout />
  if (puedeEntrarAlPortal()) return <ClienteLayout />
  return <PublicLayout />
}
