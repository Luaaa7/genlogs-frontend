import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cotizacionesApi, type RespuestaFlujoCliente } from "@/api/cotizacionesApi"
import { avisar } from "@/lib/avisos"

function refrescar(cliente: ReturnType<typeof useQueryClient>, id: number) {
  void cliente.invalidateQueries({ queryKey: ["cotizaciones"] })
  void cliente.invalidateQueries({ queryKey: ["cotizaciones", id] })
}

/** Aprobada por el Jefe → correo de la cotización y, si sale, Enviada. */
export function useMarcarEnviada(id: number) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: () => cotizacionesApi.marcarEnviada(id),
    onSuccess: () => {
      avisar("Cotización enviada.")
      refrescar(cliente, id)
    },
  })
}

/** Registra lo que respondió el cliente. No crea la orden de compra. */
export function useRegistrarRespuestaFlujo(id: number) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (body: RespuestaFlujoCliente) => cotizacionesApi.registrarRespuestaFlujo(id, body),
    onSuccess: () => {
      avisar("Respuesta del cliente registrada.")
      refrescar(cliente, id)
    },
  })
}
