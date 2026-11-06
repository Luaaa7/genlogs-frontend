import { axiosClient } from "./axiosClient"
import type { EscalaMargenes } from "@/lib/margenes"

/** Escala de márgenes (backend: /api/configuracion/margenes). Requiere sesión. */
export async function obtenerEscalaMargenes(): Promise<EscalaMargenes> {
  const { data } = await axiosClient.get<EscalaMargenes>("/configuracion/margenes")
  return {
    productos: (data?.productos ?? []).map((r) => ({
      costoDesde: Number(r.costoDesde),
      costoHasta: r.costoHasta === null || r.costoHasta === undefined ? null : Number(r.costoHasta),
      margenSugerido: Number(r.margenSugerido),
      margenMinimo: Number(r.margenMinimo),
    })),
    servicios: (data?.servicios ?? []).map((s) => ({
      idCategoriaServicio: s.idCategoriaServicio ?? null,
      nombreCategoria: s.nombreCategoria ?? null,
      margenSugerido: Number(s.margenSugerido),
      margenMinimo: Number(s.margenMinimo),
    })),
  }
}

/** Reemplaza la escala completa (solo ADMINISTRADOR). */
export async function guardarEscalaMargenes(escala: EscalaMargenes): Promise<EscalaMargenes> {
  const { data } = await axiosClient.put<EscalaMargenes>("/configuracion/margenes", escala)
  return data
}