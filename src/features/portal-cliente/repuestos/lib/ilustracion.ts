/** Tipo de ilustración según el nombre de la categoría (las categorías vienen del backend). */
export type TipoIlustracion = "automatizacion" | "componentes" | "fabricaciones" | "valvulas" | "general"

export function tipoIlustracion(categoria: string): TipoIlustracion {
  const t = categoria.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  if (t.includes("valvul")) return "valvulas"
  if (t.includes("automat") || t.includes("control")) return "automatizacion"
  if (t.includes("fabric")) return "fabricaciones"
  if (t.includes("componente") || t.includes("accesorio")) return "componentes"
  return "general"
}
