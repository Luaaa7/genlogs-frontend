import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { listarAlertasDocumentos, marcarAlertaLeida } from "@/api/alertasDocumentosApi"

export const CLAVE_ALERTAS_DOCUMENTOS = ["alertas-documentos"] as const

export function useAlertasDocumentos() {
  return useQuery({
    queryKey: CLAVE_ALERTAS_DOCUMENTOS,
    queryFn: listarAlertasDocumentos,
    retry: false,
  })
}

export function useMarcarAlertaLeida() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (idNotificacion: number) => marcarAlertaLeida(idNotificacion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLAVE_ALERTAS_DOCUMENTOS })
      // La campanita de FE-A, si existe, lee la misma lista.
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] })
    },
  })
}
