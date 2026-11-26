/** Iniciales para el avatar: primera letra del primer y del último nombre. Vacío si no hay nombre. */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return ""
  const primera = partes[0][0]
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ""
  return `${primera}${ultima}`.toUpperCase()
}
