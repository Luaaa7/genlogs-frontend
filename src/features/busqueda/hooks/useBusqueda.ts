import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sourcingApi, type BuscarReferenciasRequest, type GuardarUrlRequest } from "@/api/sourcingApi"
import { usePermisos } from "@/lib/permisos"

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

/** Para prellenar el tipo de cambio; si el endpoint aún no existe o falla, simplemente no hay valor. */
export function useTipoCambioDelDia() {
  return useQuery({
    queryKey: ["tipo-cambio", "dia"],
    queryFn: () => sourcingApi.tipoCambioDelDia(),
    retry: false,
    staleTime: 30 * 60_000,
  })
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

/** Matriz v3.2 "Búsqueda e historial": el Asistente Logístico busca y marca (C); Gerente y Jefe Adm. solo ven (V). */
export function usePuedeBuscar() {
  return usePermisos().puedeCrear("busqueda")
}
