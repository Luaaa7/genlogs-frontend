import type { EstadoBadgeTono } from "@/components/ui/EstadoBadge"
import type { EstadoReferencia } from "@/api/sourcingApi"

/** Estado de una referencia, como se muestra en la tabla y en los filtros. */
export const ESTADOS_REFERENCIA: Record<EstadoReferencia, { label: string; tono: EstadoBadgeTono }> = {
  CAPTURADO: { label: "Nueva", tono: "info" },
  UTIL: { label: "Útil", tono: "success" },
  DESCARTADO: { label: "Descartada", tono: "neutral" },
  CONVERTIDO: { label: "En vitrina", tono: "accent" },
}

/** Nombre de cada fuente; un código que no esté aquí se muestra tal cual. */
export const FUENTES: Record<string, string> = {
  EBAY: "eBay",
  MERCADO_LIBRE: "Mercado Libre",
  AMAZON: "Amazon",
  ALIEXPRESS: "AliExpress",
  ALIBABA: "Alibaba",
  PROVEEDOR: "Proveedor",
}

export const nombreFuente = (codigo: string) => FUENTES[codigo] ?? codigo
