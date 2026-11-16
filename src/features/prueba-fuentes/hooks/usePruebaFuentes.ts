import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buscarPrueba, guardarCorrida, resumenPrueba, type PedidoPrueba } from '@/api/pruebaFuentesApi'

const CLAVE = ['prueba-fuentes']

export function useResumenPrueba() {
  return useQuery({ queryKey: CLAVE, queryFn: resumenPrueba })
}

export function useBuscarPrueba() {
  return useMutation({ mutationFn: (v: { marca: string; numeroParte: string }) => buscarPrueba(v.marca, v.numeroParte) })
}

/** Al guardar cambian los aciertos: se recargan la tabla y la pantalla de Fuentes de Luana. */
export function useGuardarCorrida() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pedidos: PedidoPrueba[]) => guardarCorrida(pedidos),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLAVE })
      qc.invalidateQueries({ queryKey: ['fuentes-busqueda'] })
    },
  })
}