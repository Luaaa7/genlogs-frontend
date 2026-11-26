import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cotizacionesApi, type RespuestaFlujoCliente } from "@/api/cotizacionesApi"
import { avisar } from "@/lib/avisos"
import { ordenesCompraKeys } from "@/features/ordenes-compra/hooks/useOrdenesCompra"

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

/**
 * Registra lo que respondió el cliente. Si aceptó y es persona natural (DNI), el backend crea la orden
 * en ese mismo momento: se recarga también la lista de órdenes para que el botón y el paso de la barra
 * de progreso salgan al instante, sin salir y volver a entrar.
 */
export function useRegistrarRespuestaFlujo(id: number) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (body: RespuestaFlujoCliente) => cotizacionesApi.registrarRespuestaFlujo(id, body),
    onSuccess: () => {
      avisar("Respuesta del cliente registrada.")
      refrescar(cliente, id)
      void cliente.invalidateQueries({ queryKey: ordenesCompraKeys.all })
    },
  })
}
