// src/features/cotizaciones/hooks/useCotizaciones.ts

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { cotizacionesApi } from '@/api/cotizacionesApi';
import type { Cotizacion, CotizacionesListResponse, CotizacionesFilterParams } from '@/types/cotizacion.types';

/**
 * Hook para listar cotizaciones con filtros y paginación
 */
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
  });
}

/**
 * Hook para obtener una cotización específica por ID
 */
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

/**
 * Hook para obtener estadísticas de cotizaciones
 */
export function useCotizacionesEstadisticas() {
  return useQuery({
    queryKey: ['cotizaciones-estadisticas'],
    queryFn: () => cotizacionesApi.obtenerEstadisticas(),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });
}
