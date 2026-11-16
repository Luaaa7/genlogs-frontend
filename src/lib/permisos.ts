import { useAuthStore } from '@/features/auth/store/authStore'

/**
 * Permisos por rol de la v3.2 (Paso 0). NADIE MAS EDITA ESTE ARCHIVO: si un bloque
 * necesita un permiso nuevo, lo pide a quien hizo el Paso 0.
 *
 * Es solo para mostrar u ocultar: quien bloquea de verdad es el backend
 * (@PreAuthorize y SecurityConfig), asi que esta tabla debe coincidir con el.
 * Fuente: "GENLOGS - Procesos, roles e impacto en la BD (v3.2)", matriz de permisos.
 */

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export const ROLES = [
  'GERENTE_GENERAL',
  'JEFE_ADMINISTRATIVO',
  'CONTADOR_GENERAL',
  'SUPERVISOR_SST',
  'ASISTENTE_LOGISTICO',
  'ASISTENTE_ADMINISTRATIVO',
  'CLIENTE',
] as const

export type Rol = (typeof ROLES)[number]

/** Los 6 roles del personal de GENLOGS (todos menos CLIENTE). */
export const ROLES_INTERNOS: readonly Rol[] = ROLES.filter((r) => r !== 'CLIENTE')

/**
 * Roles anteriores a la v3.0 y su equivalente (v3_0_roles.sql). Sirve mientras la
 * base de pruebas tenga los nombres viejos; despues del despliegue ya no aparecen.
 */
const ROLES_ANTERIORES: Record<string, Rol> = {
  ADMINISTRADOR: 'JEFE_ADMINISTRATIVO',
  VENDEDOR: 'ASISTENTE_LOGISTICO',
}

/** Rol de la v3.2 a partir del nombre que trae la sesion (o null si no es ninguno). */
export function normalizarRol(nombreRol: string | null | undefined): Rol | null {
  const texto = (nombreRol ?? '').trim().toUpperCase()
  if ((ROLES as readonly string[]).includes(texto)) return texto as Rol
  return ROLES_ANTERIORES[texto] ?? null
}

// ---------------------------------------------------------------------------
// Matriz de la v3.2:  C = crea o edita - A = aprueba - V = solo ve - (sin clave) = sin acceso
// ---------------------------------------------------------------------------

export type Acceso = 'C' | 'A' | 'V'

export type Modulo =
  | 'solicitudes'
  | 'busqueda'
  | 'cotizaciones'
  | 'pedidosOc'
  | 'compras'
  | 'despacho'
  | 'comprobantes'
  | 'reclamos'
  | 'documentos'
  | 'dashboard'
  | 'vitrina'
  | 'servicios'
  | 'administracion'

export const MATRIZ: Record<Modulo, Partial<Record<Rol, Acceso>>> = {
  /** Solicitudes y plazos. CLIENTE: solo las suyas y solo estados. */
  solicitudes: { GERENTE_GENERAL: 'V', JEFE_ADMINISTRATIVO: 'C', ASISTENTE_LOGISTICO: 'C', ASISTENTE_ADMINISTRATIVO: 'V', CLIENTE: 'C' },
  /** Busqueda e historial. */
  busqueda: { GERENTE_GENERAL: 'V', JEFE_ADMINISTRATIVO: 'V', ASISTENTE_LOGISTICO: 'C' },
  /** Cotizaciones y margenes. Gerente: aviso de alto valor. Asist. Adm. y CLIENTE: sin margen; CLIENTE solo la suya. */
  cotizaciones: { GERENTE_GENERAL: 'V', JEFE_ADMINISTRATIVO: 'A', ASISTENTE_LOGISTICO: 'C', ASISTENTE_ADMINISTRATIVO: 'V', CLIENTE: 'A' },
  /** Pedidos y OC de la minera. CLIENTE: los suyos. */
  pedidosOc: { GERENTE_GENERAL: 'V', JEFE_ADMINISTRATIVO: 'V', CONTADOR_GENERAL: 'V', SUPERVISOR_SST: 'V', ASISTENTE_LOGISTICO: 'V', ASISTENTE_ADMINISTRATIVO: 'C', CLIENTE: 'V' },
  /** Compras e importaciones. */
  compras: { GERENTE_GENERAL: 'V', JEFE_ADMINISTRATIVO: 'V', CONTADOR_GENERAL: 'V', ASISTENTE_LOGISTICO: 'C' },
  /** Despacho y seguimiento. SST aprueba pase y SCTR. CLIENTE: los suyos. */
  despacho: { GERENTE_GENERAL: 'V', JEFE_ADMINISTRATIVO: 'V', SUPERVISOR_SST: 'A', ASISTENTE_LOGISTICO: 'C', ASISTENTE_ADMINISTRATIVO: 'V', CLIENTE: 'V' },
  /** Comprobantes y cobranza. CLIENTE: los suyos. */
  comprobantes: { GERENTE_GENERAL: 'V', JEFE_ADMINISTRATIVO: 'V', CONTADOR_GENERAL: 'C', ASISTENTE_ADMINISTRATIVO: 'V', CLIENTE: 'V' },
  /** Reclamos. Gerente: los escalados. CLIENTE: los suyos. */
  reclamos: { GERENTE_GENERAL: 'C', JEFE_ADMINISTRATIVO: 'A', ASISTENTE_LOGISTICO: 'C', ASISTENTE_ADMINISTRATIVO: 'V', CLIENTE: 'C' },
  /** Documentos y homologacion. Contador: los financieros; SST: los de SST. */
  documentos: { GERENTE_GENERAL: 'V', JEFE_ADMINISTRATIVO: 'V', CONTADOR_GENERAL: 'C', SUPERVISOR_SST: 'C', ASISTENTE_ADMINISTRATIVO: 'C' },
  /** Dashboard y KPI. Contador: financiero; Asist. Log.: operativo. */
  dashboard: { GERENTE_GENERAL: 'V', JEFE_ADMINISTRATIVO: 'V', CONTADOR_GENERAL: 'V', ASISTENTE_LOGISTICO: 'V' },
  /** Vitrina (productos publicados). CLIENTE: con precio. */
  vitrina: { GERENTE_GENERAL: 'V', JEFE_ADMINISTRATIVO: 'V', ASISTENTE_LOGISTICO: 'C', ASISTENTE_ADMINISTRATIVO: 'V', CLIENTE: 'V' },
  /** Servicios (margen). Asist. Adm.: sin margen; CLIENTE: solo precio. */
  servicios: { GERENTE_GENERAL: 'V', JEFE_ADMINISTRATIVO: 'C', ASISTENTE_LOGISTICO: 'C', ASISTENTE_ADMINISTRATIVO: 'V', CLIENTE: 'V' },
  /** Usuarios, parametros, feriados y tipo de cambio. */
  administracion: { GERENTE_GENERAL: 'V', JEFE_ADMINISTRATIVO: 'C' },
}

/** Margenes, precios de proveedor y precios del historial de busqueda solo los ven estos 3. */
export const ROLES_CON_MARGEN: readonly Rol[] = ['GERENTE_GENERAL', 'JEFE_ADMINISTRATIVO', 'ASISTENTE_LOGISTICO']

/** Acceso de un rol a un modulo, o null si no tiene. */
export function acceso(rol: Rol | null, modulo: Modulo): Acceso | null {
  if (!rol) return null
  return MATRIZ[modulo][rol] ?? null
}

// ---------------------------------------------------------------------------
// Permisos de la sesion
// ---------------------------------------------------------------------------

export function permisosDe(nombreRol: string | null | undefined) {
  const rol = normalizarRol(nombreRol)
  const es = (...roles: Rol[]) => rol !== null && roles.includes(rol)
  const puedeVer = (modulo: Modulo) => acceso(rol, modulo) !== null
  const puedeCrear = (modulo: Modulo) => acceso(rol, modulo) === 'C'
  const puedeAprobar = (modulo: Modulo) => acceso(rol, modulo) === 'A'
  const esInterno = rol !== null && rol !== 'CLIENTE'

  return {
    /** Rol de la v3.2 (los nombres viejos ya vienen traducidos). */
    rol,
    esCliente: rol === 'CLIENTE',
    esInterno,
    puedeVer,
    puedeCrear,
    puedeAprobar,
    /** Margenes, precio de proveedor y precios del historial de busqueda. */
    verMargenes: es(...ROLES_CON_MARGEN),

    // ---- Administracion (antes "solo ADMINISTRADOR") ----
    /** Usuarios, IGV, margenes, parametros, feriados y tipo de cambio: edita el Jefe Administrativo. */
    esAdmin: puedeCrear('administracion'),
    verAdministracion: esInterno && puedeVer('administracion'),
    editarParametros: puedeCrear('administracion'),
    editarFeriados: puedeCrear('administracion'),
    editarTipoCambio: puedeCrear('administracion'),
    /** Campanita de avisos internos (D-21): todo el personal. */
    verNotificaciones: esInterno,

    // ---- Claves que ya usan las pantallas actuales (traducidas a la matriz) ----
    verCatalogosYEmpresas: esInterno && puedeVer('vitrina'),
    editarCotizaciones: esInterno && (puedeCrear('cotizaciones') || puedeAprobar('cotizaciones')),
    cambiarEstadoCotizacion: esInterno && (puedeCrear('cotizaciones') || puedeAprobar('cotizaciones')),
    gestionarOrdenes: puedeCrear('pedidosOc') || es('JEFE_ADMINISTRATIVO'),
    verReclamos: esInterno && puedeVer('reclamos'),
    gestionarReclamos: esInterno && (puedeCrear('reclamos') || puedeAprobar('reclamos')),
    eliminarReclamos: es('JEFE_ADMINISTRATIVO'),
    emitirFactura: puedeCrear('comprobantes'),
    registrarPago: puedeCrear('comprobantes'),
    /** BE-A: la anulacion pasa de ADMINISTRADOR a JEFE_ADMINISTRATIVO. */
    anularFactura: es('JEFE_ADMINISTRATIVO'),
    enviarFactura: es('CONTADOR_GENERAL', 'JEFE_ADMINISTRATIVO'),
    editarClientesYProveedores: es('JEFE_ADMINISTRATIVO', 'ASISTENTE_LOGISTICO'),
    editarCatalogos: puedeCrear('vitrina') || es('JEFE_ADMINISTRATIVO'),
    editarEmpresasMineras: es('JEFE_ADMINISTRATIVO'),

    // ---- S2 (v3.3): servicios y comprobantes con la matriz ----
    /** Catálogo de servicios: Gerente y Asist. Adm. ven; Jefe y Asist. Log. editan. Sin Contador ni SST. */
    verServicios: esInterno && puedeVer('servicios'),
    /** Comprobantes: Gerente, Jefe, Contador y Asist. Adm. Sin SST ni Asist. Log. */
    verComprobantes: esInterno && puedeVer('comprobantes'),

    // ---- C2 (v3.3): cotizaciones y órdenes por separado (antes verCotizacionesYOrdenes) ----
    /** Cotizaciones: Gerente, Jefe, Asist. Log. y Asist. Adm. (sin margen). Sin Contador ni SST. */
    verCotizaciones: esInterno && puedeVer('cotizaciones'),
    /** Pedidos y OC de la minera: todo el personal. */
    verOrdenes: esInterno && puedeVer('pedidosOc'),

    // ---- L3 (v3.3, BPMN 9-A): fuentes de búsqueda ----
    /** Configuración > Fuentes de búsqueda: el Jefe Administrativo y el Asistente Logístico (solo estado). */
    verFuentes: es('JEFE_ADMINISTRATIVO', 'ASISTENTE_LOGISTICO'),
    /** Cuenta de búsqueda, probar sesión, activar, pausa y límite: solo el Jefe Administrativo. */
    configurarFuentes: es('JEFE_ADMINISTRATIVO'),
  }
}

export type Permisos = ReturnType<typeof permisosDe>

export function usePermisos(): Permisos {
  const nombreRol = useAuthStore((s) => s.nombreRol)
  return permisosDe(nombreRol)
}