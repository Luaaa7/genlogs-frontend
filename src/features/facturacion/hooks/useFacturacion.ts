import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { facturacionApi } from '@/api/facturacionApi'
import type { EmitirFacturaInput, EnviarComprobanteInput, EstadoFacturacion, FacturacionFiltros, FacturaInput, RegistrarPagoInput } from '@/types/facturacion.types'

export const facturacionKeys = {
  all: ['facturacion'] as const,
  lista: (filtros: FacturacionFiltros) => ['facturacion', filtros] as const,
}

export function useFacturas(filtros: FacturacionFiltros = {}) {
  return useQuery({ queryKey: facturacionKeys.lista(filtros), queryFn: () => facturacionApi.listar(filtros) })
}

export function useCrearFactura() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FacturaInput) => facturacionApi.crear(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: facturacionKeys.all }),
  })
}

export function useTiposComprobante() {
  return useQuery({ queryKey: ['tipos-comprobante'], queryFn: facturacionApi.tiposComprobante, staleTime: 60 * 60 * 1000 })
}

export function useSubirArchivoFactura() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, archivo }: { id: number; archivo: File }) => facturacionApi.subirArchivo(id, archivo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: facturacionKeys.all }),
  })
}

export function useRegistrarPago() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, pago }: { id: number; pago: RegistrarPagoInput }) => facturacionApi.registrarPago(id, pago),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: facturacionKeys.all }),
  })
}

export function useAnularFactura() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => facturacionApi.anular(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: facturacionKeys.all }),
  })
}
export function useEmitirFactura() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EmitirFacturaInput) => facturacionApi.emitir(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: facturacionKeys.all }),
  })
}

/** Modo de emisión configurado en el backend (SUNAT_MODO). */
export function useSunatConfig() {
  return useQuery({ queryKey: ['facturacion', 'sunat'], queryFn: facturacionApi.sunatConfig, staleTime: 10 * 60 * 1000 })
}

export function useEnviarFactura() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EnviarComprobanteInput }) => facturacionApi.enviar(id, data),
  })
}
/** Cambio manual de estado (Emitida / Vencida). Pago parcial y Pagada salen de registrar pago. */
export function useCambiarEstadoFactura(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (codigo: EstadoFacturacion) => facturacionApi.cambiarEstado(id, codigo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: facturacionKeys.all }),
  })
}