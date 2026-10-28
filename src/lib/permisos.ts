import { useAuthStore } from '@/features/auth/store/authStore'

const ADMIN = 'ADMINISTRADOR'
const VENDEDOR = 'VENDEDOR'
const JEFE = 'JEFE_ADMINISTRATIVO'
const CONTADOR = 'CONTADOR_GENERAL'
const GERENTE = 'GERENTE_GENERAL'

/**
 * Qué puede hacer cada rol. Es solo para ocultar botones: quien realmente bloquea
 * es el backend (@PreAuthorize), así que esta tabla debe coincidir con él.
 */
export function permisosDe(nombreRol: string | null | undefined) {
  const rol = (nombreRol ?? '').toUpperCase()
  const es = (...roles: string[]) => roles.includes(rol)
  return {
    rol,
    esAdmin: es(ADMIN),
    verCotizacionesYOrdenes: es(ADMIN, VENDEDOR, JEFE, GERENTE),
    verCatalogosYEmpresas: !es(CONTADOR),
    editarCotizaciones: es(ADMIN, VENDEDOR),
    cambiarEstadoCotizacion: es(ADMIN, VENDEDOR, JEFE),
    gestionarOrdenes: es(ADMIN, VENDEDOR, JEFE),
    emitirFactura: es(ADMIN, VENDEDOR, CONTADOR),
    registrarPago: es(ADMIN, CONTADOR),
    anularFactura: es(ADMIN),
    enviarFactura: es(ADMIN, VENDEDOR, JEFE, CONTADOR),
    editarClientesYProveedores: es(ADMIN, VENDEDOR),
    editarCatalogos: es(ADMIN, VENDEDOR),
    editarEmpresasMineras: es(ADMIN),
  }
}

export function usePermisos() {
  const nombreRol = useAuthStore((s) => s.nombreRol)
  return permisosDe(nombreRol)
}
