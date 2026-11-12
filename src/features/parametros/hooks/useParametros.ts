import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actualizarMargenesRepuesto, actualizarParametro, listarParametros } from '@/api/parametrosApi'
import {
  aNumero,
  aValorBackend,
  clavesCambiadas,
  ordenDeGuardado,
  type GrupoParametros,
} from '../lib/gruposParametros'

export const CLAVE_PARAMETROS = ['parametros'] as const

export function useParametros() {
  return useQuery({ queryKey: CLAVE_PARAMETROS, queryFn: listarParametros, staleTime: 60_000 })
}

/**
 * Guarda los parámetros cambiados de un grupo.
 * - Márgenes de repuestos: los tres juntos (todo o nada).
 * - Grupos con orden (márgenes de servicios): de a uno, en un orden que no rompa
 *   la regla mínimo <= ... <= máximo en ningún paso.
 * - El resto: de a uno.
 */
export function useGuardarGrupo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ grupo, guardados, valores }: {
      grupo: GrupoParametros
      guardados: Record<string, string>
      valores: Record<string, string>
    }) => {
      if (grupo.id === 'margenesRepuesto') {
        await actualizarMargenesRepuesto({
          min: aNumero(valores.MARGEN_REP_MIN),
          porDefecto: aNumero(valores.MARGEN_REP_DEFAULT),
          max: aNumero(valores.MARGEN_REP_MAX),
        })
        return
      }
      const cambiadas = clavesCambiadas(grupo, guardados, valores)
      const orden = grupo.ordenadas ? ordenDeGuardado(grupo.ordenadas, guardados, valores) : cambiadas
      for (const clave of orden) {
        await actualizarParametro(clave, aValorBackend(valores[clave]))
      }
    },
    // También si falla a medias: así la pantalla muestra lo que de verdad quedó guardado.
    onSettled: () => qc.invalidateQueries({ queryKey: CLAVE_PARAMETROS }),
  })
}
