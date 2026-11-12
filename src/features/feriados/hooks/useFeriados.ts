import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { crearFeriado, listarFeriados, quitarFeriado, type FeriadoRequest } from '@/api/feriadosApi'

export const CLAVE_FERIADOS = ['feriados'] as const

/** Feriados desde hoy, ordenados por fecha. */
export function useFeriados() {
  return useQuery({
    queryKey: CLAVE_FERIADOS,
    queryFn: async () => (await listarFeriados()).sort((a, b) => a.fecha.localeCompare(b.fecha)),
    staleTime: 60_000,
  })
}

export function useCrearFeriado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (feriado: FeriadoRequest) => crearFeriado(feriado),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE_FERIADOS }),
  })
}

export function useQuitarFeriado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (idFeriado: number) => quitarFeriado(idFeriado),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE_FERIADOS }),
  })
}
