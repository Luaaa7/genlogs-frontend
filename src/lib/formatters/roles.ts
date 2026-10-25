/** Nombre legible de un rol a partir de su código interno:
 *  "GERENTE_GENERAL" → "Gerente general", "JEFE_ADMINISTRATIVO" → "Jefe administrativo". */
export function nombreRolLegible(codigo: string | null | undefined): string {
  if (!codigo) return ''
  const texto = codigo.trim().replace(/_+/g, ' ').toLowerCase()
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}