import type { Rol } from '@/lib/permisos'
import type { NotificacionResponse } from '@/api/contratos'

/**
 * Quienes ven "PASE y SCTR por vencer" (S2, matriz de Documentos): Gerente y Jefe ven;
 * Contador, Supervisor SST y Asistente Administrativo editan. El Asistente Logístico no.
 */
export const ROLES_ALERTAS_DOCUMENTOS: Rol[] = [
  'GERENTE_GENERAL', 'JEFE_ADMINISTRATIVO', 'CONTADOR_GENERAL', 'SUPERVISOR_SST', 'ASISTENTE_ADMINISTRATIVO',
]

/** Tramo del aviso (7, 15 o 30 días) leído del título "… (aviso de N días)"; null si no lo trae. */
export function tramoDe(titulo: string): number | null {
  const encontrado = /\(aviso de (\d+) días\)/.exec(titulo)
  return encontrado ? Number(encontrado[1]) : null
}

/** Sin leer primero; dentro de cada grupo, el tramo más urgente y luego el más reciente. */
export function ordenarAlertas(alertas: NotificacionResponse[]): NotificacionResponse[] {
  return [...alertas].sort((a, b) => {
    if (a.leida !== b.leida) return a.leida ? 1 : -1
    const ta = tramoDe(a.titulo) ?? 99
    const tb = tramoDe(b.titulo) ?? 99
    if (ta !== tb) return ta - tb
    return b.fechaCreacion.localeCompare(a.fechaCreacion)
  })
}