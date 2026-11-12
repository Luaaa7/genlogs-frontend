import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { avisar } from '@/lib/avisos'
import { despachosApi } from '../api/despachosApi'

export function useDespachos() {
  return useQuery({ queryKey: ['despachos'], queryFn: () => despachosApi.listar() })
}

export function useDespacho(id: number | null) {
  return useQuery({
    queryKey: ['despachos', id],
    queryFn: () => despachosApi.obtener(id as number),
    enabled: id !== null,
  })
}

function useAccionDespacho(id: number, texto: string, accion: (id: number) => Promise<unknown>) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: () => accion(id),
    onSuccess: () => {
      avisar(texto)
      void cliente.invalidateQueries({ queryKey: ['despachos'] })
      void cliente.invalidateQueries({ queryKey: ['despachos', id] })
    },
  })
}

export function useAccionesDespacho(id: number) {
  return {
    avanzar: useAccionDespacho(id, 'Etapa avanzada.', despachosApi.avanzar),
    salida: useAccionDespacho(id, 'Salida registrada.', despachosApi.darSalida),
    pase: useAccionDespacho(id, 'Pase confirmado.', despachosApi.confirmarPase),
    sctr: useAccionDespacho(id, 'SCTR confirmado.', despachosApi.confirmarSctr),
  }
}
