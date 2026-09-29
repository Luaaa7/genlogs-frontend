// src/api/proformasApi.ts
import axios from "axios"
import { axiosClient } from "./axiosClient"
import { EstadoCotizacion } from "@/types/cotizacion.types"
import type { Cotizacion, CotizacionesListResponse } from "@/types/cotizacion.types"
import type {
  Proforma,
  ProformaRequest,
  ProformaResponse,
  ProformasFiltros,
  ProformasListResponse,
  ProformasPage,
} from "@/types/proforma.types"

const RECURSO = "/proformas"

/** Unifica camelCase / snake_case y garantiza que `adjuntos` sea siempre un arreglo. */
export function normalizarProforma(respuesta: ProformaResponse): Proforma {
  const { numeroOrdenCompra, numero_orden_compra, adjuntos, ...resto } = respuesta
  return {
    ...resto,
    numeroOrdenCompra: numeroOrdenCompra ?? numero_orden_compra ?? null,
    adjuntos: adjuntos ?? [],
  }
}

function construirParams(filtros: ProformasFiltros): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: filtros.page ?? 0,
    size: filtros.size ?? 10,
  }
  if (filtros.estadoProforma) params.estadoProforma = filtros.estadoProforma
  if (filtros.sortBy) {
    params.sortBy = filtros.sortBy
    params.sortDir = filtros.sortDir ?? "DESC"
  }
  return params
}

export async function listarProformas(filtros: ProformasFiltros = {}): Promise<ProformasPage> {
  const { data } = await axiosClient.get<ProformasListResponse>(RECURSO, {
    params: construirParams(filtros),
  })
  return {
    content: (data.content ?? []).map(normalizarProforma),
    totalElements: data.totalElements ?? 0,
    totalPages: data.totalPages ?? 0,
    page: data.page ?? data.currentPage ?? data.number ?? filtros.page ?? 0,
    size: data.size ?? data.pageSize ?? filtros.size ?? 10,
  }
}

export async function obtenerProforma(id: number): Promise<Proforma> {
  const { data } = await axiosClient.get<ProformaResponse>(`${RECURSO}/${id}`)
  return normalizarProforma(data)
}

export async function crearProforma(payload: ProformaRequest): Promise<Proforma> {
  const { data } = await axiosClient.post<ProformaResponse>(RECURSO, payload)
  return normalizarProforma(data)
}

export async function actualizarProforma(id: number, payload: ProformaRequest): Promise<Proforma> {
  const { data } = await axiosClient.put<ProformaResponse>(`${RECURSO}/${id}`, payload)
  return normalizarProforma(data)
}

/** Cotizaciones que pueden vincularse a una proforma (solo las APROBADAS). */
export async function listarCotizacionesAprobadas(): Promise<Cotizacion[]> {
  const { data } = await axiosClient.get<CotizacionesListResponse>("/cotizaciones", {
    params: { estadoCotizacion: EstadoCotizacion.APROBADA, page: 0, size: 100 },
  })
  return (data.content ?? []).filter(
    (c) => c.id !== undefined && c.estadoCotizacion === EstadoCotizacion.APROBADA
  )
}

/** Extrae un mensaje legible de un error de la API de proformas. */
export function mensajeErrorProforma(
  error: unknown,
  porDefecto = "No se pudo completar la operación con la proforma."
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string> }
      | undefined

    if (data?.message) return data.message
    const detalle = data?.errors ? Object.values(data.errors)[0] : undefined
    if (detalle) return detalle

    if (!error.response) return "Sin conexión con el servidor. Revisa tu red."
    switch (error.response.status) {
      case 400:
      case 422:
        return "Los datos de la proforma no son válidos. Revísalos e intenta de nuevo."
      case 403:
        return "No tienes permisos para realizar esta acción."
      case 404:
        return "No se encontró la proforma o la cotización indicada."
      case 409:
        return "La operación entra en conflicto con datos existentes (¿la cotización ya tiene una proforma?)."
      default:
        return porDefecto
    }
  }
  return porDefecto
}