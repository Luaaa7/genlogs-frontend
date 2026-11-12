import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  listarServicios,
  buscarServicioPorId,
  registrarServicio,
  actualizarServicio,
  desactivarServicio,
  aprobarServicio,
  rechazarServicio,
  type ServicioConImagen,
} from "@/api/serviciosApi"
import { listarParametros } from "@/api/parametrosApi"
import type { ClaveParametro, ParametroSistema } from "@/api/contratos/parametros"

export const RANGO_MARGEN_SERVICIO = ["parametros-servicio"] as const

function valorDe(lista: ParametroSistema[] | undefined, clave: ClaveParametro): number | null {
  const texto = lista?.find((p) => p.clave === clave)?.valor
  if (texto == null || texto.trim() === "") return null
  const n = Number(texto)
  return Number.isFinite(n) ? n : null
}

/** MARGEN_SERV_MIN y MARGEN_SERV_MAX. Si no cargan, el rango es null y el formulario igual se guarda. */
export function useRangoMargenServicio() {
  const query = useQuery({
    queryKey: RANGO_MARGEN_SERVICIO,
    queryFn: listarParametros,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
  const minimo = valorDe(query.data, "MARGEN_SERV_MIN")
  const maximo = valorDe(query.data, "MARGEN_SERV_MAX")
  return {
    rango: minimo != null && maximo != null ? { minimo, maximo } : null,
    isError: query.isError,
  }
}

export function useServicios(idCategoriaServicio?: number, soloActivos = true) {
  return useQuery({
    queryKey: ["servicios", { idCategoriaServicio, soloActivos }],
    queryFn: () => listarServicios({ idCategoriaServicio, soloActivos }),
  })
}

export function useServicio(id: number | undefined) {
  return useQuery({
    queryKey: ["servicio", id],
    queryFn: () => buscarServicioPorId(id as number),
    enabled: id !== undefined,
  })
}

export function useCrearServicio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (valores: ServicioConImagen) => registrarServicio(valores),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicios"] })
    },
  })
}

export function useActualizarServicio(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (valores: ServicioConImagen) => actualizarServicio(id, valores),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicios"] })
      queryClient.invalidateQueries({ queryKey: ["servicio", id] })
    },
  })
}

export function useDesactivarServicio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => desactivarServicio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicios"] })
    },
  })
}

export function useRechazarServicio(id: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => rechazarServicio(id as number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicio", id] })
      queryClient.invalidateQueries({ queryKey: ["servicios"] })
    },
  })
}

export function useAprobarServicio(id: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => aprobarServicio(id as number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicio", id] })
      queryClient.invalidateQueries({ queryKey: ["servicios"] })
    },
  })
}
