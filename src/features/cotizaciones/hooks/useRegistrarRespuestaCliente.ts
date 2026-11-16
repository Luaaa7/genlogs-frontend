import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cotizacionesApi, type RespuestaClienteRequest } from "@/api/cotizacionesApi"
import { ordenesCompraKeys } from "@/features/ordenes-compra/hooks/useOrdenesCompra"
import { avisar } from "@/lib/avisos"

/** Registra la respuesta. No crea la orden: si el código es APROBADA, la crea el backend. */
export function useRegistrarRespuestaCliente(id: number) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: (body: RespuestaClienteRequest) => cotizacionesApi.registrarRespuestaCliente(id, body),
    onSuccess: () => {
      avisar("Respuesta del cliente registrada.")
      void cliente.invalidateQueries({ queryKey: ["cotizaciones"] })
      void cliente.invalidateQueries({ queryKey: ["cotizaciones", id] })
      void cliente.invalidateQueries({ queryKey: ordenesCompraKeys.all })
    },
  })
}
