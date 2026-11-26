import type { EtapaCodigo } from "@/features/despacho/api/despachoTipos"

/**
 * Etapas que ve el cliente. «En aduana» solo existe para importados: como el portal no recibe el origen,
 * se muestra únicamente cuando el despacho está en esa etapa (no se supone para los demás).
 */
export function etapasDelDespacho(etapa: string): EtapaCodigo[] {
  const base: EtapaCodigo[] = ["REGISTRADO", "EN_PREPARACION", "EN_TRANSITO", "ENTREGADO"]
  return etapa === "EN_ADUANA" ? ["REGISTRADO", "EN_PREPARACION", "EN_ADUANA", "EN_TRANSITO", "ENTREGADO"] : base
}
