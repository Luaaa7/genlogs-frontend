// src/features/proformas/hooks/useProformas.ts
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import * as proformasApi from "@/api/proformasApi"
import type { ProformasFiltros } from "@/types/proforma.types"

export const proformasKeys = {
  all: ["proformas"] as const,
  lista: (filtros: ProformasFiltros) => ["proformas", "lista", filtros] as const,
  detalle: (id: number) => ["proformas", "detalle", id] as const,
}

/** Listado paginado con filtros. Mantiene la página anterior visible mientras carga la nueva. */
export function useProformas(filtros: ProformasFiltros = {}) {
  return useQuery({
    queryKey: proformasKeys.lista(filtros),
    queryFn: () => proformasApi.listarProformas(filtros),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

export function useProforma(id: number) {
  return useQuery({
    queryKey: proformasKeys.detalle(id),
    queryFn: () => proformasApi.obtenerProforma(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}

/** Cotizaciones APROBADAS disponibles para vincular a una nueva proforma. */
export function useCotizacionesAprobadas() {
  return useQuery({
    queryKey: ["cotizaciones", "aprobadas"],
    queryFn: proformasApi.listarCotizacionesAprobadas,
    staleTime: 60_000,
  })
}