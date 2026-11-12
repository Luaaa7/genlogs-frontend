import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { portalReclamosApi, type CalificacionReclamoPortal, type NuevoReclamoPortal } from "@/api/portalReclamosApi"

export function useReclamosPortal() {
  return useQuery({ queryKey: ["portal-reclamos"], queryFn: portalReclamosApi.listar })
}

export function useReclamoPortal(id: number | undefined) {
  return useQuery({
    queryKey: ["portal-reclamo", id],
    queryFn: () => portalReclamosApi.detalle(id as number),
    enabled: typeof id === "number" && Number.isFinite(id),
  })
}

export function useCrearReclamo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reclamo: NuevoReclamoPortal) => portalReclamosApi.crear(reclamo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portal-reclamos"] }),
  })
}

export function useCalificarReclamo(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (calificacion: CalificacionReclamoPortal) => portalReclamosApi.calificar(id, calificacion),
    onSuccess: (reclamo) => {
      queryClient.setQueryData(["portal-reclamo", id], reclamo)
      queryClient.invalidateQueries({ queryKey: ["portal-reclamos"] })
    },
  })
}
