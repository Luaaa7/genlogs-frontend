import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  activarFuente,
  cambiarParametros,
  guardarCredenciales,
  listarFuentes,
  probarSesion,
} from '@/api/fuentesApi'

const CLAVE = ['fuentes-busqueda']

export function useFuentes() {
  return useQuery({ queryKey: CLAVE, queryFn: listarFuentes })
}

/** Cada acción vuelve a pedir la lista: el backend es quien decide el estado de la tienda. */
function useAccion<T>(fn: (v: T) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }) })
}

export const useGuardarCuenta = () =>
  useAccion((v: { codigo: string; usuario?: string; clave?: string }) =>
    guardarCredenciales(v.codigo, { usuario: v.usuario, clave: v.clave }))

export const useProbarSesion = () => useAccion((codigo: string) => probarSesion(codigo))

export const useActivarFuente = () =>
  useAccion((v: { codigo: string; activa: boolean }) => activarFuente(v.codigo, v.activa))

export const useCambiarLimites = () =>
  useAccion((v: { codigo: string; pausaSegundos: number; limiteDiario: number }) =>
    cambiarParametros(v.codigo, { pausaSegundos: v.pausaSegundos, limiteDiario: v.limiteDiario }))
