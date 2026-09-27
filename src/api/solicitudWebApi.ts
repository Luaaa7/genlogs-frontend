// src/api/solicitudWebApi.ts

import axios, { type AxiosInstance } from 'axios';
import type {
  SolicitudWeb,
  CreateSolicitudWebRequest,
  SolicitudWebResponse,
  EstadoSolicitud,
} from '@/types/solicitudWeb.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

class SolicitudWebApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token si está disponible (acceso autenticado)
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Crea una solicitud web pública (sin autenticación)
   */
  async crearSolicitudWeb(
    data: CreateSolicitudWebRequest
  ): Promise<SolicitudWebResponse> {
    const response = await this.axiosInstance.post<SolicitudWebResponse>(
      '/solicitudes-web',
      data
    );
    return response.data;
  }

  /**
   * Obtiene solicitudes web (acceso protegido para equipo interno)
   */
  async listarSolicitudesWeb(page: number = 0, size: number = 10): Promise<{
    content: SolicitudWeb[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  }> {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('size', String(size));
    params.append('sortBy', 'fechaCreacion');
    params.append('sortDir', 'DESC');

    const response = await this.axiosInstance.get(
      '/solicitudes-web',
      { params }
    );
    return response.data;
  }

  /**
   * Obtiene una solicitud web específica por ID (acceso protegido)
   */
  async obtenerSolicitudWeb(id: number): Promise<SolicitudWeb> {
    const response = await this.axiosInstance.get<SolicitudWeb>(
      `/solicitudes-web/${id}`
    );
    return response.data;
  }

  /**
   * Actualiza el estado de una solicitud web (acceso protegido)
   */
  async actualizarEstadoSolicitud(
    id: number,
    nuevoEstado: EstadoSolicitud,
    observaciones?: string
  ): Promise<SolicitudWeb> {
    const response = await this.axiosInstance.put<SolicitudWeb>(
      `/solicitudes-web/${id}/estado`,
      {
        estadoSolicitud: nuevoEstado,
        observacionesInternas: observaciones,
      }
    );
    return response.data;
  }

  /**
   * Asocia una cotización a una solicitud web
   */
  async asociarCotizacion(
    solicitudId: number,
    cotizacionId: number
  ): Promise<SolicitudWeb> {
    const response = await this.axiosInstance.put<SolicitudWeb>(
      `/solicitudes-web/${solicitudId}/cotizacion`,
      { cotizacionId }
    );
    return response.data;
  }

  /**
   * Busca solicitudes web por filtros (acceso protegido)
   */
  async buscarSolicitudesWeb(filtros: {
    estado?: EstadoSolicitud;
    email?: string;
    empresaNombre?: string;
    page?: number;
    size?: number;
  }): Promise<{
    content: SolicitudWeb[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  }> {
    const params = new URLSearchParams();

    if (filtros.estado) {
      params.append('estado', filtros.estado);
    }
    if (filtros.email) {
      params.append('email', filtros.email);
    }
    if (filtros.empresaNombre) {
      params.append('empresaNombre', filtros.empresaNombre);
    }

    params.append('page', String(filtros.page ?? 0));
    params.append('size', String(filtros.size ?? 10));
    params.append('sortBy', 'fechaCreacion');
    params.append('sortDir', 'DESC');

    const response = await this.axiosInstance.get(
      '/solicitudes-web/buscar',
      { params }
    );
    return response.data;
  }

  /**
   * Envía un email de confirmación para una solicitud web
   */
  async enviarConfirmacion(
    solicitudId: number,
    email: string
  ): Promise<{ success: boolean; mensaje: string }> {
    const response = await this.axiosInstance.post(
      `/solicitudes-web/${solicitudId}/enviar-confirmacion`,
      { email }
    );
    return response.data;
  }
}

export const solicitudWebApi = new SolicitudWebApiClient();
