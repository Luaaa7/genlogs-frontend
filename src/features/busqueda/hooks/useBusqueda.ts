import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sourcingApi, type BuscarReferenciasRequest, type GuardarUrlRequest } from "@/api/sourcingApi"
import { useAuthStore } from "@/features/auth/store/authStore"

const clave = (numeroParte: string) => ["sourcing", "historial", numeroParte.trim().toLowerCase()] as const

/** Historial de un N.º de parte (incluye descartadas, para ver todo lo que se encontró). */
export function useHistorialReferencias(numeroParte: string | undefined) {
  return useQuery({
    queryKey: clave(numeroParte ?? ""),
    queryFn: () => sourcingApi.historial({ numeroParte }),
    enabled: !!numeroParte?.trim(),
  })
}

export function useBuscarReferencias() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: BuscarReferenciasRequest) => sourcingApi.buscar(body),
    onSuccess: (_, body) => qc.invalidateQueries({ queryKey: clave(body.numeroParte) }),
  })
}

export function useCambiarEstadoReferencia(numeroParte: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ idSourcing, estado }: { idSourcing: number; estado: "UTIL" | "DESCARTADO" }) =>
      sourcingApi.cambiarEstado(idSourcing, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: clave(numeroParte) }),
  })
}

export function useLeerUrl() {
  return useMutation({ mutationFn: (url: string) => sourcingApi.leerUrl(url) })
}

export function useGuardarUrl(numeroParte: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: GuardarUrlRequest) => sourcingApi.guardarUrl(body),
    onSuccess: (ref) => {
      qc.invalidateQueries({ queryKey: clave(numeroParte) })
      if (ref.numeroParte) qc.invalidateQueries({ queryKey: clave(ref.numeroParte) })
    },
  })
}

/**
 * Matriz v3.2 "Búsqueda e historial": el Asistente Logístico busca y marca;
 * Gerente y Jefe Adm. solo ven. Cuando el Paso 0 traiga permisos.ts con los
 * 7 roles, reemplazar por usePermisos().
 */
export const ROLES_VEN_BUSQUEDA = ["ASISTENTE_LOGISTICO", "JEFE_ADMINISTRATIVO", "GERENTE_GENERAL"]

export function usePuedeBuscar() {
  const rol = (useAuthStore((s) => s.nombreRol) ?? "").toUpperCase()
  return rol === "ASISTENTE_LOGISTICO"
}
