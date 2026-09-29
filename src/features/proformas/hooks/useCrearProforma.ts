// src/features/proformas/hooks/useCrearProforma.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { AxiosError } from "axios"
import * as proformasApi from "@/api/proformasApi"
import type { Proforma, ProformaRequest } from "@/types/proforma.types"
import { proformasKeys } from "./useProformas"

interface ErrorResponse {
  message?: string
  errors?: Record<string, string>
}

/**
 * Crea una proforma. Al terminar invalida el listado y deja el detalle en caché.
 * Para mostrar el error usa `mensajeErrorProforma(error)` de `@/api/proformasApi`.
 */
export function useCrearProforma() {
  const queryClient = useQueryClient()

  return useMutation<Proforma, AxiosError<ErrorResponse>, ProformaRequest>({
    mutationFn: (payload) => proformasApi.crearProforma(payload),
    onSuccess: (proforma) => {
      queryClient.setQueryData(proformasKeys.detalle(proforma.id), proforma)
      return queryClient.invalidateQueries({ queryKey: proformasKeys.all })
    },
  })
}

/** Actualiza una proforma existente (PUT /proformas/{id}). */
export function useActualizarProforma(id: number) {
  const queryClient = useQueryClient()

  return useMutation<Proforma, AxiosError<ErrorResponse>, ProformaRequest>({
    mutationFn: (payload) => proformasApi.actualizarProforma(id, payload),
    onSuccess: (proforma) => {
      queryClient.setQueryData(proformasKeys.detalle(id), proforma)
      return queryClient.invalidateQueries({ queryKey: proformasKeys.all })
    },
  })
}