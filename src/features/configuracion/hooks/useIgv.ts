import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { IGV_POR_DEFECTO, listarHistorialIgv, obtenerIgvVigente, registrarTasaIgv } from "@/api/igvApi"

/** % de IGV que rige hoy (18 mientras carga o si el backend aún no lo tiene). */
export function useIgvVigente() {
  const consulta = useQuery({ queryKey: ["igv", "vigente"], queryFn: obtenerIgvVigente, staleTime: 10 * 60_000 })
  return { ...consulta, porcentaje: consulta.data ?? IGV_POR_DEFECTO }
}

export function useHistorialIgv() {
  return useQuery({ queryKey: ["igv", "historial"], queryFn: listarHistorialIgv })
}

export function useRegistrarTasaIgv() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ porcentaje, vigenteDesde }: { porcentaje: number; vigenteDesde: string }) =>
      registrarTasaIgv(porcentaje, vigenteDesde),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["igv"] }),
  })
}
