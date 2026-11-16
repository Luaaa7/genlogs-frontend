import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { corregirTipoCambio, obtenerTipoCambio } from '@/api/tipoCambioApi'

export const CLAVE_TIPO_CAMBIO = ['tipo-cambio', 'hoy'] as const

export function useTipoCambio(activo = true) {
  return useQuery({ queryKey: CLAVE_TIPO_CAMBIO, queryFn: obtenerTipoCambio, staleTime: 60_000, enabled: activo })
}

export function useCorregirTipoCambio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (valor: number) => corregirTipoCambio(valor),
    onSuccess: (dia) => qc.setQueryData(CLAVE_TIPO_CAMBIO, dia),
  })
}
