// src/features/solicitudes-web/hooks/useSolicitudesWeb.ts

import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { solicitudWebApi } from '@/api/solicitudWebApi';
import type {
  SolicitudWeb,
  CreateSolicitudWebRequest,
  SolicitudWebResponse,
  EstadoSolicitud,
} from '@/types/solicitudWeb.types';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
  status?: number;
}

interface ListResponse {
  content: SolicitudWeb[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Hook para crear una solicitud web pública (sin autenticación requerida)
 */
export function useCrearSolicitudWeb(): UseMutationResult<
  SolicitudWebResponse,
  AxiosError<ErrorResponse>,
  CreateSolicitudWebRequest
> {
  return useMutation({
    mutationFn: (data: CreateSolicitudWebRequest) =>
      solicitudWebApi.crearSolicitudWeb(data),
    onError: (error) => {
      console.error('Error al crear solicitud web:', error);
    },
  });
}

/**
 * Hook para listar solicitudes web (acceso protegido)
 */
export function useSolicitudesWeb(
  page: number = 0,
  size: number = 10
): UseQueryResult<ListResponse> {
  return useQuery({
    queryKey: ['solicitudes-web', page, size],
    queryFn: () => solicitudWebApi.listarSolicitudesWeb(page, size),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
  });
}

/**
 * Hook para obtener una solicitud web específica por ID
 */
export function useSolicitudWeb(
  id: number | null | undefined
): UseQueryResult<SolicitudWeb> {
  return useQuery({
    queryKey: ['solicitudes-web', id],
    queryFn: () => solicitudWebApi.obtenerSolicitudWeb(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 2,
  });
}

/**
 * Hook para actualizar el estado de una solicitud web
 */
export function useActualizarEstadoSolicitud(
  solicitudId: number
): UseMutationResult<
  SolicitudWeb,
  AxiosError<ErrorResponse>,
  { estado: EstadoSolicitud; observaciones?: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ estado, observaciones }) =>
      solicitudWebApi.actualizarEstadoSolicitud(
        solicitudId,
        estado,
        observaciones
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes-web'] });
      queryClient.setQueryData(['solicitudes-web', solicitudId], data);
    },
    onError: (error) => {
      console.error('Error al actualizar estado de solicitud:', error);
    },
  });
}

/**
 * Hook para asociar una cotización a una solicitud web
 */
export function useAsociarCotizacion(
  solicitudId: number
): UseMutationResult<
  SolicitudWeb,
  AxiosError<ErrorResponse>,
  number
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cotizacionId: number) =>
      solicitudWebApi.asociarCotizacion(solicitudId, cotizacionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes-web'] });
      queryClient.setQueryData(['solicitudes-web', solicitudId], data);
    },
    onError: (error) => {
      console.error('Error al asociar cotización:', error);
    },
  });
}

/**
 * Hook para buscar solicitudes web con filtros
 */
export function useBuscarSolicitudesWeb(filtros: {
  estado?: EstadoSolicitud;
  email?: string;
  empresaNombre?: string;
  page?: number;
  size?: number;
}): UseQueryResult<ListResponse> {
  return useQuery({
    queryKey: ['solicitudes-web-buscar', filtros],
    queryFn: () => solicitudWebApi.buscarSolicitudesWeb(filtros),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });
}

/**
 * Hook para enviar confirmación de solicitud web
 */
export function useEnviarConfirmacion(
  solicitudId: number
): UseMutationResult<
  { success: boolean; mensaje: string },
  AxiosError<ErrorResponse>,
  string
> {
  return useMutation({
    mutationFn: (email: string) =>
      solicitudWebApi.enviarConfirmacion(solicitudId, email),
    onError: (error) => {
      console.error('Error al enviar confirmación:', error);
    },
  });
}
