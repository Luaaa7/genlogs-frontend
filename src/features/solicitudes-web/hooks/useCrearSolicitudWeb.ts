// src/features/solicitudes-web/hooks/useCrearSolicitudWeb.ts

import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { solicitudWebApi } from '@/api/solicitudWebApi';
import type { CreateSolicitudWebRequest, SolicitudWebResponse } from '@/types/solicitudWeb.types';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message: string;
  status?: number;
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