/**
 * Estados del pedido tal como los ve el cliente (P9 y RF-84): solo la barra
 * Recibida → En búsqueda → En espera de proveedor → Cotizada, sin fechas ni horas.
 * Las claves son los valores de solicitud_cotizacion.estado_solicitud del backend.
 */
import type { EstadoPedido } from "@/types/portal.types"

export const ETAPAS_PEDIDO: ReadonlyArray<{ estado: EstadoPedido; etiqueta: string }> = [
  { estado: "PENDIENTE", etiqueta: "Recibida" },
  { estado: "EN_REVISION", etiqueta: "En búsqueda" },
  { estado: "EN_ESPERA_TERCERO", etiqueta: "En espera de proveedor" },
  { estado: "COTIZADA", etiqueta: "Cotizada" },
]

const FINALES_SIN_COTIZAR: Record<string, string> = {
  CANCELADA: "Cancelada",
  RECHAZADA: "No se pudo cotizar",
}

/** Estados para filtrar "Mis pedidos", en el orden en que avanzan. */
export const ESTADOS_PEDIDO: EstadoPedido[] = [...ETAPAS_PEDIDO.map((e) => e.estado), "RECHAZADA", "CANCELADA"]

export function esEstadoFinalSinCotizar(estado: string): boolean {
  return estado in FINALES_SIN_COTIZAR
}

/** Índice de la etapa en la barra; -1 si el pedido terminó sin cotizar; 0 si el estado es desconocido. */
export function etapaDelPedido(estado: string): number {
  if (esEstadoFinalSinCotizar(estado)) return -1
  const indice = ETAPAS_PEDIDO.findIndex((e) => e.estado === estado)
  return indice === -1 ? 0 : indice
}

export function etiquetaEstado(estado: string): string {
  const etapa = ETAPAS_PEDIDO.find((e) => e.estado === estado)
  if (etapa) return etapa.etiqueta
  if (FINALES_SIN_COTIZAR[estado]) return FINALES_SIN_COTIZAR[estado]
  const texto = estado.replaceAll("_", " ").toLowerCase()
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** D-28: el cliente puede cancelar mientras no se haya empezado a cotizar con un proveedor. */
export function puedeCancelar(estado: string): boolean {
  return estado === "PENDIENTE" || estado === "EN_REVISION"
}
