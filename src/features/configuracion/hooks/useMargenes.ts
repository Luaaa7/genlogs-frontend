import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { guardarEscalaMargenes, obtenerEscalaMargenes } from "@/api/margenesApi"
import type { EscalaMargenes } from "@/lib/margenes"

/** Escala de márgenes para sugerir el margen al cotizar. */
export function useEscalaMargenes() {
  return useQuery({ queryKey: ["margenes"], queryFn: obtenerEscalaMargenes, staleTime: 10 * 60_000 })
}

export function useGuardarEscalaMargenes() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (escala: EscalaMargenes) => guardarEscalaMargenes(escala),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["margenes"] }),
  })
}