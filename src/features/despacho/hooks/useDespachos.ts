import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { avisar } from '@/lib/avisos'
import { despachosApi } from '../api/despachosApi'
import type { EtapaCodigo, TipoSst } from '../api/despachoTipos'

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

export function useDespachosPortal() {
  return useQuery({ queryKey: ['portal-despachos'], queryFn: () => despachosApi.listarPortal() })
}

export function useCrearDespacho() {
  const cliente = useQueryClient()
  return useMutation({
    retry: false,
    mutationFn: (idOrdenCompra: number) => despachosApi.crear(idOrdenCompra),
    onSuccess: (creado) => {
      avisar(`Despacho de la orden ${creado.numeroOrdenCompra} registrado.`)
      void cliente.invalidateQueries({ queryKey: ['despachos'] })
    },
  })
}

export function useAvanzarDespacho(id: number) {
  const cliente = useQueryClient()
  return useMutation({
    retry: false,
    mutationFn: (etapa: EtapaCodigo) => despachosApi.avanzar(id, etapa),
    onSuccess: () => {
      avisar('Etapa avanzada.')
      void cliente.invalidateQueries({ queryKey: ['despachos'] })
      void cliente.invalidateQueries({ queryKey: ['despachos', id] })
    },
  })
}

/** Confirma el documento y, si esta sesión puede avanzar, reintenta la misma etapa. */
export function useConfirmarSst(id: number, etapa: EtapaCodigo | null, puedeAvanzar: boolean) {
  const cliente = useQueryClient()
  return useMutation({
    retry: false,
    mutationFn: async (cuerpo: { tipo: TipoSst; fechaVencimiento: string }) => {
      await despachosApi.confirmarSst(id, cuerpo)
      if (puedeAvanzar && etapa) await despachosApi.avanzar(id, etapa)
    },
    onSuccess: () => {
      avisar(puedeAvanzar && etapa ? 'Documento confirmado. Se reintentó la etapa.' : 'Documento confirmado.')
      void cliente.invalidateQueries({ queryKey: ['despachos'] })
      void cliente.invalidateQueries({ queryKey: ['despachos', id] })
    },
  })
}
