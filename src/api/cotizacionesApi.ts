// src/api/cotizacionesApi.ts

import axios, { type AxiosInstance } from 'axios';
import type {
  Cotizacion,
  CreateCotizacionRequest,
  CotizacionesListResponse,
  CotizacionesFilterParams,
  UpdateEstadoCotizacionRequest,
  EnviarCotizacionRequest,
  AdjuntoCotizacion,
} from '@/types/cotizacion.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

class CotizacionesApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

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

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Obtiene lista de cotizaciones con filtros y paginación
   */
  async listarCotizaciones(
    filtros?: CotizacionesFilterParams
  ): Promise<CotizacionesListResponse> {
    const params = new URLSearchParams();

    if (filtros?.estadoCotizacion) {
      params.append('estadoCotizacion', filtros.estadoCotizacion);
    }
    if (filtros?.clienteId) {
      params.append('clienteId', String(filtros.clienteId));
    }
    if (filtros?.moneda) {
      params.append('moneda', filtros.moneda);
    }

    params.append('page', String(filtros?.page ?? 0));
    params.append('size', String(filtros?.size ?? 10));
    params.append('sortBy', filtros?.sortBy ?? 'fechaCreacion');
    params.append('sortDir', filtros?.sortDir ?? 'DESC');

    const response = await this.axiosInstance.get<CotizacionesListResponse>(
      '/cotizaciones',
      { params }
    );
    return response.data;
  }

  /**
   * Obtiene una cotización específica por ID con todos sus detalles
   */
  async obtenerCotizacion(id: number): Promise<Cotizacion> {
    const response = await this.axiosInstance.get<Cotizacion>(
      `/cotizaciones/${id}`
    );
    return response.data;
  }

  /**
   * Crea una nueva cotización
   */
  async crearCotizacion(
    data: CreateCotizacionRequest
  ): Promise<Cotizacion> {
    const response = await this.axiosInstance.post<Cotizacion>(
      '/cotizaciones',
      data
    );
    return response.data;
  }

  /**
   * Actualiza el estado de una cotización
   */
  async cambiarEstadoCotizacion(
    id: number,
    data: UpdateEstadoCotizacionRequest
  ): Promise<Cotizacion> {
    const response = await this.axiosInstance.put<Cotizacion>(
      `/cotizaciones/${id}/estado`,
      data
    );
    return response.data;
  }

  /**
   * Carga un adjunto a una cotización
   */
  async cargarAdjunto(
    cotizacionId: number,
    archivo: File
  ): Promise<AdjuntoCotizacion> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    const response = await this.axiosInstance.post<AdjuntoCotizacion>(
      `/cotizaciones/${cotizacionId}/adjuntos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Elimina un adjunto de una cotización
   */
  async eliminarAdjunto(
    cotizacionId: number,
    adjuntoId: number
  ): Promise<void> {
    await this.axiosInstance.delete(
      `/cotizaciones/${cotizacionId}/adjuntos/${adjuntoId}`
    );
  }

  /**
   * Envía una cotización por correo electrónico
   */
  async enviarCotizacion(
    id: number,
    data: EnviarCotizacionRequest
  ): Promise<{ success: boolean; mensaje: string }> {
    const response = await this.axiosInstance.post<{
      success: boolean;
      mensaje: string;
    }>(`/cotizaciones/${id}/enviar`, data);
    return response.data;
  }

  /**
   * Descarga una cotización en PDF
   */
  async descargarCotizacionPDF(id: number): Promise<Blob> {
    const response = await this.axiosInstance.get(
      `/cotizaciones/${id}/descargar-pdf`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }

  /**
   * Duplica una cotización existente
   */
  async duplicarCotizacion(id: number): Promise<Cotizacion> {
    const response = await this.axiosInstance.post<Cotizacion>(
      `/cotizaciones/${id}/duplicar`
    );
    return response.data;
  }

  /**
   * Obtiene estadísticas de cotizaciones
   */
  async obtenerEstadisticas(): Promise<{
    totalCotizaciones: number;
    totalPorEstado: Record<string, number>;
    montoTotalPendiente: number;
    tasaAprobacion: number;
  }> {
    const response = await this.axiosInstance.get(
      '/cotizaciones/estadisticas'
    );
    return response.data;
  }
}

export const cotizacionesApi = new CotizacionesApiClient();
