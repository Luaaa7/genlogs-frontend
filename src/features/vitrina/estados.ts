import type { EstadoBadgeTono } from "@/components/ui/EstadoBadge"
import type { EstadoPublicacion } from "@/api/contratos/enumeraciones"

export const ESTADOS_VITRINA: Record<EstadoPublicacion, { label: string; tono: EstadoBadgeTono }> = {
  BORRADOR: { label: "Borrador", tono: "neutral" },
  PUBLICADO: { label: "Publicado", tono: "success" },
  OCULTO: { label: "Oculto", tono: "warning" },
  RETIRADO: { label: "Retirado", tono: "neutral" },
}

export const TIPOS_REPUESTO = { OEM: "Original (OEM)", ALTERNATIVO: "Alternativo compatible" } as const
