import axios from 'axios'
import type { Rol } from '@/api/contratos'
import type { UsuarioResumen } from '@/api/contratos/solicitudes'
import type { UsuarioResponse } from '@/types/usuario'
import { hoyISO } from '@/lib/formatters/fechaLocal'
import { mensajeError } from '@/lib/errores'

/** Roles que entran a la pantalla. puedeVer('solicitudes') también deja pasar a otros. */
export const ROLES_PANTALLA = ['ASISTENTE_LOGISTICO', 'JEFE_ADMINISTRATIVO', 'GERENTE_GENERAL'] as const satisfies readonly Rol[]

export const ROLES_ACCION = ['ASISTENTE_LOGISTICO', 'JEFE_ADMINISTRATIVO'] as const satisfies readonly Rol[]

/** A quién se le puede reasignar una solicitud. Nombres del contrato, no textos sueltos. */
export const ROLES_ASIGNABLES = ['ASISTENTE_LOGISTICO', 'JEFE_ADMINISTRATIVO'] as const satisfies readonly Rol[]

export const ROL_JEFE = 'JEFE_ADMINISTRATIVO' satisfies Rol

export const MOTIVOS_PAUSA = [
  'Esperando respuesta del proveedor',
  'Esperando datos del cliente',
  'Esperando confirmación de stock',
  'Esperando documento de aduana',
] as const

const ROLES_DE_PANTALLA: readonly Rol[] = ROLES_PANTALLA
const ROLES_DE_ACCION: readonly Rol[] = ROLES_ACCION
const ROLES_DE_ASIGNACION: readonly string[] = ROLES_ASIGNABLES

export function entraALaPantalla(rol: Rol | null): boolean {
  return rol !== null && ROLES_DE_PANTALLA.includes(rol)
}

export function puedeActuar(rol: Rol | null): boolean {
  return rol !== null && ROLES_DE_ACCION.includes(rol)
}

/** Vacío es válido: la fecha es opcional. Si viene, es YYYY-MM-DD y no es anterior a hoy local. */
export function fechaEstimadaValida(valor: string): boolean {
  const fecha = valor.trim()
  if (!fecha) return true
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && fecha >= hoyISO()
}

export function motivoValido(motivo: string): boolean {
  const texto = motivo.trim()
  return texto.length > 0 && texto.length <= 40
}

export function filtrarAsignables(usuarios: UsuarioResponse[]): UsuarioResumen[] {
  return usuarios
    .filter((u) => !u.bloqueado && ROLES_DE_ASIGNACION.includes(u.nombreRol))
    .map((u) => ({ idUsuario: u.idUsuario, nombreUsuario: u.nombreUsuario, nombres: u.nombres }))
}

/** El 403 de GET /usuarios no tumba la pantalla: el selector explica que BE-A aún no migró el rol. */
export function mensajeCargaUsuarios(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    return 'El listado de usuarios todavía no está habilitado para el Jefe. Quedará disponible cuando entre la migración de roles.'
  }
  return mensajeError(error, 'No se pudo cargar el personal interno.')
}
