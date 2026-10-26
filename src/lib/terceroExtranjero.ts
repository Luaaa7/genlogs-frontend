/** El catálogo de distritos tiene una opción "Extranjero" (UBIGEO 90xxxx) para
 *  clientes y proveedores de fuera del Perú. Al elegirla se pide la ciudad y el
 *  país, que se guardan junto a la dirección (el tercero no tiene otra columna). */

const normalizar = (s?: string | null) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()

export function esDistritoExtranjero(d?: { ubigeo?: string | null; nombreDistrito?: string | null } | null): boolean {
  if (!d) return false
  return (d.ubigeo ?? "").startsWith("90") || normalizar(d.nombreDistrito) === "extranjero"
}

/** Pasa "Ciudad y país" a la dirección ("Av. X 123, Santiago, Chile") y quita el campo auxiliar. */
export function unirLugarExtranjero<T extends { tercero: { direccion?: string; lugarExtranjero?: string } }>(valores: T): T {
  const { lugarExtranjero, ...tercero } = valores.tercero
  const lugar = lugarExtranjero?.trim()
  if (!lugar) return { ...valores, tercero }
  const direccion = tercero.direccion?.trim()
  return { ...valores, tercero: { ...tercero, direccion: direccion ? `${direccion}, ${lugar}` : lugar } }
}