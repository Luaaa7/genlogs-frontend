

import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { cotizacionesApi } from '@/api/cotizacionesApi';
import type { Cotizacion, CotizacionesListResponse, CotizacionesFilterParams } from '@/types/cotizacion.types';

export function useCotizaciones(
  filtros?: CotizacionesFilterParams
): UseQueryResult<CotizacionesListResponse> {
  return useQuery({
    queryKey: ['cotizaciones', filtros],
    queryFn: () => cotizacionesApi.listarCotizaciones(filtros),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Mientras carga otra página o filtro se sigue mostrando la anterior. (Antes
    // era `initialData` vacío: con staleTime de 5 min React Query lo daba por
    // fresco y no pedía la lista al servidor.)
    placeholderData: keepPreviousData,
  });
}


export function useCotizacion(
  id: number | null | undefined
): UseQueryResult<Cotizacion> {
  return useQuery({
    queryKey: ['cotizaciones', id],
    queryFn: () => cotizacionesApi.obtenerCotizacion(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
  });
}


export function useCotizacionesEstadisticas() {
  return useQuery({
    queryKey: ['cotizaciones-estadisticas'],
    queryFn: () => cotizacionesApi.obtenerEstadisticas(),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });
}