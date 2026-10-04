import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { empresasMinerasApi } from '@/api/empresasMinerasApi'
import type { EmpresaMineraFiltros, EmpresaMineraInput } from '@/types/empresaMinera.types'

export const empresasMinerasKeys = {
  all: ['empresas-mineras'] as const,
  lista: (filtros: EmpresaMineraFiltros) => ['empresas-mineras', filtros] as const,
}

export function useEmpresasMineras(filtros: EmpresaMineraFiltros = {}) {
  return useQuery({ queryKey: empresasMinerasKeys.lista(filtros), queryFn: () => empresasMinerasApi.listar(filtros) })
}

export function useMinerales() {
  return useQuery({ queryKey: ['minerales'], queryFn: () => empresasMinerasApi.listarMinerales(), staleTime: 10 * 60_000 })
}

export function useCrearEmpresaMinera() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EmpresaMineraInput) => empresasMinerasApi.crear(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: empresasMinerasKeys.all }),
  })
}
