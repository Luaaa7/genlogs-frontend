import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reclamosApi } from '@/api/reclamosApi'
import type { EstadoReclamo, ReclamoFiltros, ReclamoInput } from '@/types/reclamo.types'

export const reclamosKeys = {
  all: ['reclamos'] as const,
  lista: (filtros: ReclamoFiltros) => ['reclamos', 'lista', filtros] as const,
  detalle: (id: number) => ['reclamos', 'detalle', id] as const,
  responsables: ['reclamos', 'responsables'] as const,
}

export function useReclamos(filtros: ReclamoFiltros = {}) {
  return useQuery({
    queryKey: reclamosKeys.lista(filtros),
    queryFn: () => reclamosApi.listar(filtros),
    placeholderData: keepPreviousData,
  })
}

export function useReclamo(id: number) {
  return useQuery({
    queryKey: reclamosKeys.detalle(id),
    queryFn: () => reclamosApi.obtener(id),
    enabled: Number.isFinite(id) && id > 0,
  })
}

export function useResponsablesReclamo() {
  return useQuery({ queryKey: reclamosKeys.responsables, queryFn: reclamosApi.responsables, staleTime: 5 * 60_000 })
}

export function useGuardarReclamo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: ReclamoInput }) =>
      id ? reclamosApi.actualizar(id, data) : reclamosApi.crear(data),
    onSuccess: (reclamo) => {
      queryClient.setQueryData(reclamosKeys.detalle(reclamo.idReclamo), reclamo)
      return queryClient.invalidateQueries({ queryKey: reclamosKeys.all })
    },
  })
}

export function useCambiarEstadoReclamo(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ estado, comentario }: { estado: EstadoReclamo; comentario?: string }) =>
      reclamosApi.cambiarEstado(id, estado, comentario),
    onSuccess: (reclamo) => {
      queryClient.setQueryData(reclamosKeys.detalle(id), reclamo)
      return queryClient.invalidateQueries({ queryKey: reclamosKeys.all })
    },
  })
}

export function useComentarReclamo(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (comentario: string) => reclamosApi.comentar(id, comentario),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reclamosKeys.detalle(id) }),
  })
}

export function useEliminarReclamo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => reclamosApi.eliminar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reclamosKeys.all }),
  })
}
